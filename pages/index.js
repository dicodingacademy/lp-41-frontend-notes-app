import Head from 'next/head';
import React, { Component } from 'react';
import Router from 'next/router';
import HeadBar from '../components/Common/HeadBar';
import AnnounceBar from '../components/Common/AnnounceBar';
import Notes from '../components/Notes';
import FloatingButton from '../components/Common/FloatingButton';

import styles from './Home.module.scss';
import { getBaseURL } from '../lib/utils/storage';
import { fetchWithAuthentication } from '../lib/utils/fetcher';
import AuthenticationError from '../lib/utils/AuthenticationError';

const onAddNoteClick = () => {
  if (window) {
    window.location.href = '/notes/new';
  }
};

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: [],
      empty: false,
      isError: false,
      accessToken: null,
    };
  }

  async componentDidMount() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('Mohon untuk login dulu.');
      await Router.push('/login');
      return;
    }
    this.setState((prevState) => ({
      ...prevState,
      accessToken,
    }));
    await this._fetch();
  }

  async _fetch() {
    try {
      const { data: { notes } } = await fetchWithAuthentication(`${getBaseURL()}notes`);
      this.setState(() => ({ notes, empty: notes.length < 1 }));
    } catch (error) {
      if (error instanceof AuthenticationError) {
        if (window) {
          alert(error.message);
        }
        // TODO redirect to login
      }
      this.setState((prevState) => ({ ...prevState, isError: true }));
    }
  }

  render() {
    const {
      notes, isError, empty, accessToken,
    } = this.state;

    if (!accessToken) {
      return <></>;
    }

    return (
      <div>
        <Head>
          <title>Notes Apps</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <AnnounceBar />
        <HeadBar />
        <main>
          {isError ? (
            <p className={styles.error}>
              Error displaying notes! Make sure you have done with the
              back-end or correct url.
            </p>
          ) : <Notes empty={empty} notes={notes} />}
        </main>
        <FloatingButton onClickHandler={onAddNoteClick} icon="/icon/add.svg" text="Add Note" />
      </div>
    );
  }
}

export default Home;
