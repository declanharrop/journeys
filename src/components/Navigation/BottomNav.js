'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GoHome, GoMilestone, GoPerson, GoLock, GoVideo } from 'react-icons/go';
import styles from '@/styles/components/Navigation/BottomNav.module.css';

const ICONS = {
  home: GoHome,
  allVideos: GoVideo,
  journeys: GoMilestone,
  account: GoPerson,
  lock: GoLock,
};

export default function BottomNav({ subscriptionStatus }) {
  const pathname = usePathname();

  // 👇 FIX: Check for ALL active statuses
  // We include 'premium' just in case you manually set some users to that.
  const isPremium = ['active', 'trialing', 'premium'].includes(subscriptionStatus);

  const navLinks = [
    {
      name: 'Home',
      href: '/home',
      activePath: '/home',
      icon: ICONS.home,
    },
    {
      name: 'All Videos',
      href: isPremium ? '/all-videos' : '/subscribe',
      activePath: '/all-videos',
      isLocked: !isPremium,
      icon: ICONS.allVideos,
    },
    {
      name: 'Journeys',
      href: isPremium ? '/journeys' : '/subscribe', 
      activePath: '/journeys',
      isLocked: !isPremium,
      icon: ICONS.journeys,
    },
    {
      name: 'Account',
      href: '/account',
      activePath: '/account', 
      icon: ICONS.account,
    },
  ];

  return (
    <nav className={styles.navContainer}>
      <ul className={styles.navList}>
        {navLinks.map((link) => {
          const isActive = pathname === link.activePath;
          const IconComponent = link.icon; 
          const LockIcon = ICONS.lock;

          return (
            <li key={link.name} className={styles.navItem}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {IconComponent && <IconComponent className={styles.icon} />}
                <span>
                  {link.name}
                  {link.isLocked && <LockIcon className={styles.lockIcon} />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}