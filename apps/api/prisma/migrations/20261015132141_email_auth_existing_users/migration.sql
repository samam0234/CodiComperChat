-- 이메일 인증 도입 전에 가입한 계정은 인증된 것으로 본다 (기존 이용자가 갑자기 발행을 못 하게 되지 않게)
UPDATE "users" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
