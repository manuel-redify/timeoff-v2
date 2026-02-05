import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    ...(process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_OAUTH_IN_DEV === "true"
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null
              }

              const user = await prisma.user.findUnique({
                where: {
                  email: credentials.email as string,
                },
              })

              if (!user) {
                return null
              }

              if (!user.activated) {
                return null
              }

              const isPasswordValid = await bcrypt.compare(
                credentials.password as string,
                user.password || ""
              )

              if (!isPasswordValid) {
                return null
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.name,
                lastName: user.lastname,
                companyId: user.companyId,
                isAdmin: user.isAdmin,
              }
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.companyId = user.companyId
        token.isAdmin = user.isAdmin
      }
      if (account?.provider === 'google' && (!token.id || !token.companyId)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user?.email! }
        })
        if (dbUser) {
          token.id = dbUser.id
          token.firstName = dbUser.name
          token.lastName = dbUser.lastname
          token.companyId = dbUser.companyId
          token.isAdmin = dbUser.isAdmin
        }
      }
      return token
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        if (!existingUser) {
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.companyId = token.companyId as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
})