import React from 'react';
import Link from 'next/link';
import styles from './HeadBar.module.scss';

const HeadBar = () => (
  <header className={styles.head_bar}>
    <h1>
      Notes
      <span> Apps (Version 2)</span>
    </h1>
    <Link href="/logout">Logout</Link>
  </header>
);

export default HeadBar;
