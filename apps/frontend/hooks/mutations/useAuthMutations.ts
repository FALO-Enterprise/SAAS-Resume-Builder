"use client";

import { useMutation } from "@tanstack/react-query";
import {
  login,
  register,
  verifyCode,
  resendCode,
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from "@/lib/api/auth";

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  });
}

export function useVerifyCodeMutation() {
  return useMutation({
    mutationFn: verifyCode,
  });
}

export function useResendCodeMutation() {
  return useMutation({
    mutationFn: resendCode,
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({ 
    mutationFn: requestPasswordReset 
  });
}

export function useResetPasswordMutation() {
  return useMutation({ 
    mutationFn: resetPassword 
  });
}

export function useValidateResetTokenMutation() {
  return useMutation({ 
    mutationFn: validateResetToken 
  });
}
