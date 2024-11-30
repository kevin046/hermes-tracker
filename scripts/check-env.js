const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

// Skip check if we're in Vercel deployment
if (process.env.VERCEL) {
  process.exit(0)
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:')
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`))
  process.exit(1)
} 