import type { DefaultSession } from "next-auth"
import type { User } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firstName: string
      lastName: string
      companyId: string
      isAdmin: boolean
    } & DefaultSession["user"]
  }

  interface User {
    firstName: string
    lastName: string
    companyId: string
    isAdmin: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firstName: string
    lastName: string
    companyId: string
    isAdmin: boolean
  }
}