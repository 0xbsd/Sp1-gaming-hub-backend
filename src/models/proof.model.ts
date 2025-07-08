export interface ProofModel {
  id: string;
  userId: string;
  gameId: string;
  sessionId: string;
  proofType: string;
  proofData: any;
  verificationStatus: 'pending' | 'verified' | 'failed';
  generationTime: number;
  gasUsed?: bigint;
  createdAt: Date;
  verifiedAt?: Date;
}
