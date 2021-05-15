import React, { Component } from 'react';
import Link from 'next/link';
import jwtDecode from 'jwt-decode';
import styles from './HeadBar.module.scss';
import fetcher from '../../../lib/utils/fetcher';
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

  render() {
    const { user } = this.state;
    return (
      <header className={styles.head_bar}>
        <h1>
          Notes
          <span> Apps (Version 2)</span>
        </h1>
        <div className={styles.side_menu}>
          <p>
            Login as
            {' '}
            { user ? user.fullname : '...'}
          </p>
          <Link href="/logout">Logout</Link>
        </div>
      </header>
    );
  }
}

export default HeadBar;
