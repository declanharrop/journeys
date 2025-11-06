'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 1. Import all the icons we need
import { GoHome, GoMilestone, GoPerson, GoLock, GoVideo } from 'react-icons/go';
// 2. Use your correct, verified style path
import styles from '@/styles/components/Navigation/BottomNav.module.css';

// 3. Define the icon component mapping
const ICONS = {
  home: GoHome,
  allVideos: GoVideo,
  journeys: GoMilestone,
  account: GoPerson,
  lock: GoLock,
};

export default function BottomNav({ subscriptionStatus }) {
  const pathname = usePathname();
  const isPremium = subscriptionStatus === 'premium';

  // 4. Define the navigation links
  // This is the clean, fixed logic:
  // We assign the icon component directly to the 'icon' property.
  const navLinks = [
    {
      name: 'Home',
      href: '/home',
      activePath: '/home',
      icon: ICONS.home, // Assign component directly
    },
    {
      name: 'All Videos',
      href: isPremium ? '/all-videos' : '/subscribe',
      activePath: '/all-videos',
      isLocked: !isPremium,
      icon: ICONS.allVideos, // Assign component directly
    },
    {
      name: 'Journeys',
      href: isPremium ? '/journeys' : '/subscribe', 
      activePath: '/journeys',
      isLocked: !isPremium,
      icon: ICONS.journeys, // Assign component directly
    },
    {
      name: 'Account',
      href: '/account',
      activePath: '/account', 
      icon: ICONS.account, // Assign component directly
    },
  ];

  return (
    <nav className={styles.navContainer}>
      <ul className={styles.navList}>
        {navLinks.map((link) => {
          const isActive = pathname === link.activePath;
          
          // 5. Get the icon component *directly* from the link object
          const IconComponent = link.icon; 
          const LockIcon = ICONS.lock;

          return (
            <li key={link.name} className={styles.navItem}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {/* This check ensures IconComponent is valid before rendering */}
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