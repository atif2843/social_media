export function Alert({ variant = 'default', children }) {
  const variantClasses = {
    default: 'bg-blue-50 text-blue-700 border-blue-200',
    destructive: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div className={`p-4 rounded-md border ${variantClasses[variant]}`}>
      {children}
    </div>
  )
}
