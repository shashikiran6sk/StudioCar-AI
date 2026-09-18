import type {
  AuthUser,
  ClaimPhoneOtpVerificationCommand,
  ClaimPhoneOtpVerificationResult,
  CompletePhoneOtpCommand,
  CreatePhoneOtpChallengeCommand,
  CreatePhoneOtpChallengeResult,
  PhoneStart,
  PhoneOtpCompletionResult,
  PhoneVerify,
} from "@studiocar/contracts";

import type {
  ActiveSession,
  PreparedSession,
} from "../session-service";

export enum PhoneOtpProviderVerificationStatus {
  Verified = "verified",
  Invalid = "invalid",
  Expired = "expired",
}

export interface PhoneOtpProvider {
  send(phoneNumber: string): Promise<{ providerRequestId: string | null }>;
  verify(
    phoneNumber: string,
    otp: string,
  ): Promise<{ status: PhoneOtpProviderVerificationStatus }>;
}

export interface PhoneOtpChallengeStore {
  createRateLimited(
    command: CreatePhoneOtpChallengeCommand,
  ): Promise<CreatePhoneOtpChallengeResult>;
  markSent(
    challengeId: string,
    providerRequestId: string | null,
    sentAt: Date,
  ): Promise<boolean>;
  markSendFailed(
    challengeId: string,
    failureCode: string,
    failedAt: Date,
  ): Promise<boolean>;
  claimVerification(
    command: ClaimPhoneOtpVerificationCommand,
  ): Promise<ClaimPhoneOtpVerificationResult>;
  recordInvalid(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
  recordExpired(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
  recordProviderVerified(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
  recordProviderError(
    challengeId: string,
    attemptId: string,
    completedAt: Date,
  ): Promise<boolean>;
}

export interface PhoneOtpCompletionStore {
  complete(command: CompletePhoneOtpCommand): Promise<PhoneOtpCompletionResult>;
}

export interface SessionPreparer {
  prepareIssue(): PreparedSession;
}

export interface StartedPhoneOtp {
  challengeId: string;
  expiresAt: Date;
  browserBinding: string;
}

export interface CompletedPhoneOtp {
  token: string;
  expiresAt: Date;
  session: ActiveSession;
  user: AuthUser;
}

export interface PhoneOtpApplication {
  start(input: PhoneStart, clientAddress: string): Promise<StartedPhoneOtp>;
  verify(
    input: PhoneVerify,
    browserBinding: string,
    clientAddress: string,
  ): Promise<CompletedPhoneOtp>;
}
