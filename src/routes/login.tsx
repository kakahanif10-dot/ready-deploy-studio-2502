import { createFileRoute } from '@tanstack/react-router'

const title = 'Sign in — Purple'
const description =
  'Sign in to Purple and turn a plain-language idea into a deployable app in minutes.'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: '/login' }],
  }),
  component: LoginPage,
})

import Link from '@/components/link'
import { ArrowLeft } from 'lucide-react'
import { PurpleLogo } from '@/components/purple-logo'
import { AuthForm } from '@/components/auth/auth-form'

function LoginPage() {
  return (
    <main className="relative flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex">
        <Link href="/" className="relative">
          <PurpleLogo />
        </Link>

        <div className="relative max-w-md">
          <blockquote className="text-2xl font-medium leading-snug tracking-tight text-balance">
            &ldquo;I described the app in a sentence and had a working, deployed
            product before my coffee got cold.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-10 w-10 rounded-full bg-foreground" />
            <div>
              <p className="text-sm font-medium">Ava Chen</p>
              <p className="text-sm text-muted-foreground">
                Founder, Northlight Labs
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-sm text-muted-foreground">
          <span>Trusted by 200k+ builders</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          <span>SOC 2 compliant</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mb-8 lg:hidden">
          <PurpleLogo />
        </div>

        <AuthForm />
      </div>
    </main>
  )
}
