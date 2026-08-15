import 'dotenv/config'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

import { RegisterData, LoginData } from "./types/auth.types"
import { setAccessToken, clearAccessToken, getAccessToken } from "@/lib/auth/token"

export const authService = {
    register: async (input: RegisterData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Registration failed')
        }

        return response.json()  // { user, token }
    },

    login: async (input: LoginData) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
        }

        const data = await response.json()  // { user, token }

        // save token
        setAccessToken(data.token)

        return data
    },

    logout: () => {
        clearAccessToken()
    },

    getToken: () => {
        return getAccessToken()
    }
}