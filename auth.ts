import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    ...(process.env.NODE_ENV === "production" || process.env.ENABLE_OAUTH_IN_DEV === "true"
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
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth linking
      if (account?.provider === "google") {
        return true
      }

      // For credentials provider, check user exists and is valid
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: user.email!,
          },
        })

        if (!dbUser) {
          return false
        }

        if (!dbUser.activated) {
          return false
        }

        if (dbUser.endDate && new Date(dbUser.endDate) < new Date()) {
          return false
        }

        return true
      }

      return false
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        
        // Fetch additional user data
        const dbUser = await prisma.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            name: true,
            lastname: true,
            companyId: true,
            isAdmin: true,
          },
        })

        if (dbUser) {
          session.user.firstName = dbUser.name
          session.user.lastName = dbUser.lastname
          session.user.companyId = dbUser.companyId
          session.user.isAdmin = dbUser.isAdmin
        }
      }

      return session
    },
  },
})