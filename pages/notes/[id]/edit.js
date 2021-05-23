import React, { Component } from 'react';
import Head from 'next/head';
import Editor from 'rich-markdown-editor';
import Link from 'next/link';
import Router from 'next/router';
import Autosuggest from 'react-autosuggest';
import AnnounceBar from '../../../components/Common/AnnounceBar';
import styles from './Edit.module.scss';
import { getBaseURL } from '../../../lib/utils/storage';
import fetcher, { fetchWithAuthentication } from '../../../lib/utils/fetcher';
import AuthenticationError from '../../../lib/utils/AuthenticationError';

class Edit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      body: '',
      tags: [],
      isFetching: false,
      isError: false,
      note: null,
      accessToken: null,
      suggestions: [],
      collaboratorId: '',
    };

    this.contentEditable = React.createRef();

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTagsChange = this.handleTagsChange.bind(this);
    this.handleBodyChange = this.handleBodyChange.bind(this);
    this.handleUpdateNote = this.handleUpdateNote.bind(this);
    this.handleDeleteNote = this.handleDeleteNote.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.getSuggestionValue = this.getSuggestionValue.bind(this);
    this.onSuggestionChange = this.onSuggestionChange.bind(this);
    this.onSuggestionFetchRequested = this.onSuggestionFetchRequested.bind(this);
    this.onSuggestionClearRequested = this.onSuggestionClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onAddCollaboration = this.onAddCollaboration.bind(this);
    this.onDeleteCollaboration = this.onDeleteCollaboration.bind(this);
    this.onImageUpload = this.onImageUpload.bind(this);
  }

  async componentDidMount() {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      alert('Mohon untuk login dulu.');
      await Router.push('/login');
      return;
    }

    try {
      const { id } = this.props;
      const { data: { note } } = await fetchWithAuthentication(`${getBaseURL()}notes/${id}`);
      const { title, body, tags } = note;

      this.setState((prevState) => ({
        ...prevState, note, title, body, tags, accessToken,
      }));
    } catch (error) {
      this.setState((prevState) => ({ ...prevState, isError: true }));
    }
  }

  handleTitleChange({ target }) {
    this.setState((prevState) => ({
      ...prevState,
      title: target.value,
    }));
  }

  handleTagsChange({ target }) {
    this.setState((prevState) => ({
      ...prevState,
      tags: target.value.split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ''),
    }));
  }

  handleBodyChange(value) {
    const body = value();
    this.setState((prevState) => ({
      ...prevState,
      body: body === '\\\n' ? '' : body,
    }));
  }

  async handleUpdateNote() {
    const { title, body, tags } = this.state;
    const { id } = this.props;

    this.setState((prevState) => ({
      ...prevState,
      isFetching: true,
    }));

    try {
      await fetchWithAuthentication(`${getBaseURL()}notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, tags }),
      });

      if (window) {
        window.location.href = `/notes/${id}`;
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        if (window) {
          alert(error.message);
        }
        // TODO redirect to login
      }

      if (window) {
        alert(error.message);
      }

      this.setState((prevState) => ({
        ...prevState,
        isFetching: false,
      }));
    }
  }

  async handleDeleteNote() {
    const { id } = this.props;

    try {
      await fetchWithAuthentication(`${getBaseURL()}notes/${id}`, {
        method: 'DELETE',
      });

      if (window) {
        window.location.href = '/';
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        if (window) {
          alert(error.message);
        }
        // TODO redirect to login
      }

      if (window) {
        alert(error.message);
      }

      this.setState((prevState) => ({
        ...prevState,
        isFetching: false,
      }));
    }
  }

  onSuggestionChange(event, { newValue }) {
    this.setState((prevState) => ({ ...prevState, collaboratorId: newValue }));
  }

  async onSuggestionFetchRequested({ value }) {
    const users = await this.searchUsers(value);
    this.setState((prevState) => ({ ...prevState, suggestions: users }));
  }

  onSuggestionClearRequested() {
    this.setState((prevState) => ({ ...prevState, suggestions: [] }));
  }

  onSuggestionSelected(event, { suggestion }) {
    this.setState((prevState) => ({ ...prevState, collaboratorId: suggestion.id }));
  }

  async onAddCollaboration() {
    const { collaboratorId: userId, note: { id: noteId } } = this.state;

    try {
      const { message } = await fetchWithAuthentication(`${getBaseURL()}collaborations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, noteId }),
      });
      alert(message);
      this.setState((prevState) => ({ ...prevState, collaboratorId: '' }));
    } catch (error) {
      alert(error.message);
      this.setState((prevState) => ({ ...prevState, collaboratorId: '' }));
    }
  }

  async onDeleteCollaboration() {
    const { collaboratorId: userId, note: { id: noteId } } = this.state;

    try {
      const { message } = await fetchWithAuthentication(`${getBaseURL()}collaborations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, noteId }),
      });
      alert(message);
      this.setState((prevState) => ({ ...prevState, collaboratorId: '' }));
    } catch (error) {
      alert(error.message);
      this.setState((prevState) => ({ ...prevState, collaboratorId: '' }));
    }
  }

  async onImageUpload(file) {
    const formData = new FormData();
    formData.append('data', file);
    const response = await fetch(`${getBaseURL()}upload/images`, {
      method: 'POST',
      body: formData,
    });

    if (response.status !== 201) {
      const { message } = await response.json();
      alert(message);
      return '';
    }

    const { data: { fileLocation } } = await response.json();
    return fileLocation;
  }

  getSuggestionValue(user) {
    return user.id;
  }

  async searchUsers(value) {
    if (!value.length) {
      return [];
    }

    try {
      const { data: { users } } = await fetcher(`${getBaseURL()}users?username=${value}`);
      return users;
    } catch (error) {
      return [];
    }
  }

  renderSuggestion(suggestion) {
    return (
      <div>
        <p>
          <strong>{suggestion.id}</strong>
          {' '}
          (
          {suggestion.username}
          )
        </p>
      </div>
    );
  }

  renderError() {
    return (
      <div>
        <Head>
          <title>Notes - Not Found</title>
        </Head>
        <AnnounceBar />
        <main className={styles.error}>
          <p>Error displaying notes! Make sure you have done with the back-end or correct url.</p>
          <Link href="/">Back to Home</Link>
        </main>
      </div>
    );
  }

  renderSuccess() {
    const {
      title, body, isFetching, tags, collaboratorId, suggestions,
    } = this.state;

    const inputProps = {
      placeholder: 'Search by username to get user id',
      value: collaboratorId,
      onChange: this.onSuggestionChange,
    };

    return (
      <div>
        <Head>
          <title>
            Edit -
            {' '}
            {title}
          </title>
        </Head>
        <AnnounceBar />
        <main className={styles.edit_page}>
          <section className={styles.edit_page__content}>
            <header className={styles.edit_page__header}>
              <input
                className={styles.edit_page__title}
                value={title}
                onChange={this.handleTitleChange}
                type="text"
                autoComplete="off"
                placeholder="Note title"
              />
              <input
                className={styles.edit_page__tags}
                placeholder="Tag 1, Tag 2, Tag 3"
                defaultValue={tags.join(', ')}
                type="text"
                autoComplete="off"
                onChange={this.handleTagsChange}
              />
            </header>

            <div className={styles.edit_page__body}>
              <Editor
                defaultValue={body}
                uploadImage={this.onImageUpload}
                onChange={this.handleBodyChange}
              />
            </div>

            <div className={styles.edit_page__collaboration}>
              <h3>Collaboration</h3>
              <p>User Id</p>
              <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={this.onSuggestionFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                onSuggestionSelected={this.onSuggestionSelected}
                inputProps={inputProps}
              />
              <div>
                <button type="button" onClick={this.onAddCollaboration}>Add</button>
                <button type="button" onClick={this.onDeleteCollaboration}>Remove</button>
              </div>
            </div>

            <div className={styles.edit_page__action}>
              <button
                disabled={isFetching}
                className={styles.update_button}
                type="button"
                onClick={this.handleUpdateNote}
              >
                Save Note
              </button>
              <button
                className={styles.delete_button}
                type="button"
                onClick={this.handleDeleteNote}
              >
                Delete Note
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  render() {
    const { isError, note, accessToken } = this.state;

    if (!accessToken) {
      return <></>;
    }

    if (isError) {
      return this.renderError();
    }

    if (note) {
      return this.renderSuccess();
    }

    return (<></>);
  }
}

export async function getServerSideProps({ params }) {
  const { id } = params;
  return { props: { id } };
}

export default Edit;
