import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import {
  BellIcon,
  ChevronDownIcon,
  DashboardIcon,
  LogoutIcon,
  TestCreationIcon,
} from './icons'
import { Wordmark } from './Wordmark'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/tests/new', label: 'Test Creation', Icon: TestCreationIcon },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name || user?.userId || 'Signed in'
  const role = (user?.role as string) || 'Admin'

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Link to="/dashboard" aria-label="Preproute home">
            <Wordmark />
          </Link>
        </div>

        <nav className="sidebar__nav" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className="sidebar__link">
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div className="topbar__mobile-brand">
            <Link to="/dashboard" aria-label="Preproute home">
              <Wordmark small />
            </Link>
          </div>

          <button type="button" className="icon-btn" aria-label="Notifications">
            <BellIcon size={17} />
          </button>

          <div ref={accountRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="account"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="avatar" aria-hidden="true">
                {initials(displayName)}
              </span>
              <span className="account__text">
                <span className="account__name">{displayName}</span>
                <span className="account__role">{role}</span>
              </span>
              <ChevronDownIcon size={15} />
            </button>

            {menuOpen && (
              <div className="menu" role="menu">
                <button type="button" className="menu__item" role="menuitem" onClick={logout}>
                  <LogoutIcon size={16} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
