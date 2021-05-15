import React, { Component } from 'react';
import Link from 'next/link';
import jwtDecode from 'jwt-decode';
import styles from './HeadBar.module.scss';
import fetcher, { fetchWithAuthentication } from '../../../lib/utils/fetcher';
import { getBaseURL } from '../../../lib/utils/storage';

class HeadBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
    };
  }

  async componentDidMount() {
    if (window) {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const { id: userId } = jwtDecode(accessToken);
        const { data: { user } } = await fetcher(`${getBaseURL()}users/${userId}`);
        this.setState((prevState) => ({ ...prevState, user }));
      } catch {
        // doing nothing
      }
    }
  }

  async onExportClickHandler() {
    try {
      const targetEmail = prompt('Give me your email');

      if (!targetEmail) {
        return;
      }

      const response = await fetchWithAuthentication(`${getBaseURL()}export/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetEmail }),
      });

      alert(response.message);
    } catch (error) {
      alert(error.message);
    }
  }

  render() {
    const { user } = this.state;
    return (
      <header className={styles.head_bar}>
        <h1>
          Notes
          <span> Apps (Version 3)</span>
        </h1>
        <div className={styles.side_menu}>
          <p>
            Login as
            {' '}
            { user ? user.fullname : '...'}
          </p>
          <button type="button" onClick={this.onExportClickHandler}>Export Notes</button>
          <Link href="/logout">Logout</Link>
        </div>
      </header>
    );
  }
}

export default HeadBar;
