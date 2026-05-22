import { useState } from 'react'
import LoginModal from './LoginModal'
import { useTranslation } from '../i18n/LanguageContext'

export default function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <nav className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="font-black italic text-2xl uppercase tracking-tighter">
          IRON<span className="text-orange-500">GYM</span>
        </div>
        <button
          onClick={() => setIsLoginOpen(true)}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/20"
        >
          {t('navbar.clientArea')}
        </button>
      </nav>

      {/* Aquí llamamos al modal que creamos antes */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
