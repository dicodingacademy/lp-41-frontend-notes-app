import Head from 'next/head';
import React, { Component } from 'react';

import Router from 'next/router';
import Editor from 'rich-markdown-editor';
import styles from './New.module.scss';
import AnnounceBar from '../../components/Common/AnnounceBar';
import { getBaseURL } from '../../lib/utils/storage';
import { fetchWithAuthentication } from '../../lib/utils/fetcher';
import AuthenticationError from '../../lib/utils/AuthenticationError';

class New extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      body: '',
      tags: [],
      isFetching: false,
      accessToken: null,
    };

    this.contentEditable = React.createRef();

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTagsChange = this.handleTagsChange.bind(this);
    this.handleBodyChange = this.handleBodyChange.bind(this);
    this.handleSaveNote = this.handleSaveNote.bind(this);
    this.onImageUpload = this.onImageUpload.bind(this);
  }

  async componentDidMount() {
    if (window) {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        alert('Mohon untuk login dulu');
        await Router.push('/login');
        return;
      }

      this.setState((prevState) => ({
        ...prevState,
        accessToken,
      }));
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

  async handleSaveNote() {
    const { title, body, tags } = this.state;

    this.setState((prevState) => ({
      ...prevState,
      isFetching: true,
    }));

    await this._fetch({ title, body, tags });
  }

  // eslint-disable-next-line class-methods-use-this
  handleDiscardNote() {
    if (window) {
      window.location.href = '/';
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

  async _fetch({ title, body, tags }) {
    try {
      await fetchWithAuthentication(`${getBaseURL()}notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, tags }),
      });

      if (window) {
        window.location.href = '/';
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        if (window) {
          alert(error.message);
        }

        await Router.push('/login');
        return;
      }

      alert(error.message);

      this.setState((prevState) => ({
        ...prevState,
        isFetching: false,
      }));
    }
  }

  render() {
    const {
      title, isFetching, accessToken,
    } = this.state;

    if (!accessToken) {
      return <></>;
    }

    return (
      <div>
        <Head>
          <title>Add New Notes</title>
        </Head>
        <AnnounceBar />
        <main className={styles.new_page}>
          <section className={styles.new_page__content}>
            <header className={styles.new_page__header}>
              <input
                className={styles.new_page__title}
                value={title}
                onChange={this.handleTitleChange}
                type="text"
                autoComplete="off"
                placeholder="Note title"
              />
              <input
                className={styles.new_page__tags}
                placeholder="Tag 1, Tag 2, Tag 3"
                type="text"
                autoComplete="off"
                onChange={this.handleTagsChange}
              />
            </header>

            <div className={styles.new_page__body}>
              <Editor
                uploadImage={this.onImageUpload}
                onChange={this.handleBodyChange}
              />
            </div>

            <div className={styles.new_page__action}>
              <button
                disabled={isFetching}
                className={styles.update_button}
                type="button"
                onClick={this.handleSaveNote}
              >
                Save Note
              </button>
              <button
                className={styles.delete_button}
                type="button"
                onClick={this.handleDiscardNote}
              >
                Discard
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

export default New;
