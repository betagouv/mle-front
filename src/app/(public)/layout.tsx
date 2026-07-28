import { LoginRequiredModals } from '~/components/auth/login-required-modal'
import { CommonSkipLinks, MAIN_CONTENT_ID } from '~/components/ui/common-skip-links'
import { CommonFooter } from '~/components/ui/footer/footer'
import { CommonHeader } from '~/components/ui/header/common-header'
import styles from './layout.module.css'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <CommonSkipLinks />
      <CommonHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.container}>
        {children}
      </main>
      <CommonFooter />
      <LoginRequiredModals />
    </>
  )
}
