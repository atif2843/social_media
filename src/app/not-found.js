import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="mb-4 text-4xl font-bold">404</h2>
        <p className="mb-4 text-lg text-muted-foreground">
          This page could not be found.
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
