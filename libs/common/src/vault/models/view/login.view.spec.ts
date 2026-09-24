import { LoginView as SdkLoginView } from "@bitwarden/sdk-internal";

import { mockFromJson, mockFromSdk } from "../../../../spec";

import { LoginUriView } from "./login-uri.view";
import { LoginView } from "./login.view";

jest.mock("../../models/view/login-uri.view");

describe("LoginView", () => {
  beforeEach(() => {
    (LoginUriView as any).mockClear();
  });

  it("fromJSON initializes nested objects", () => {
    jest.spyOn(LoginUriView, "fromJSON").mockImplementation(mockFromJson);

    const passwordRevisionDate = new Date();

    const actual = LoginView.fromJSON({
      passwordRevisionDate: passwordRevisionDate.toISOString(),
      uris: ["uri1", "uri2", "uri3"] as any,
    });

    expect(actual).toMatchObject({
      passwordRevisionDate: passwordRevisionDate,
      uris: ["uri1_fromJSON", "uri2_fromJSON", "uri3_fromJSON"],
    });
  });

  describe("fromSdkLoginView", () => {
    it("should return a LoginView from an SdkLoginView", () => {
      jest.spyOn(LoginUriView, "fromSdkLoginUriView").mockImplementation(mockFromSdk);

      const sdkLoginView = {
        username: "username",
        password: "password",
        passwordRevisionDate: "2025-01-01T01:06:40.441Z",
        uris: [{ uri: "bitwarden.com" } as any],
        totp: "totp",
        autofillOnPageLoad: true,
      } as SdkLoginView;

      const result = LoginView.fromSdkLoginView(sdkLoginView);

      expect(result).toMatchObject({
        username: "username",
        password: "password",
        passwordRevisionDate: new Date("2025-01-01T01:06:40.441Z"),
        uris: [expect.objectContaining({ uri: "bitwarden.com", __fromSdk: true })],
        totp: "totp",
        autofillOnPageLoad: true,
      });
    });

    it("should map the decrypted FIDO2 credentials returned by the SDK", () => {
      jest.spyOn(LoginUriView, "fromSdkLoginUriView").mockImplementation(mockFromSdk);

      const sdkLoginView = {
        fido2Credentials: [
          {
            credentialId: "cred-id",
            keyType: "public-key",
            keyAlgorithm: "ECDSA",
            keyCurve: "P-256",
            keyValue: "decrypted-key-value",
            rpId: "bitwarden.com",
            userHandle: "userHandle",
            userName: "userName",
            counter: "2",
            rpName: "rpName",
            userDisplayName: "userDisplayName",
            discoverable: "true",
            creationDate: "2025-01-01T01:06:40.441Z",
          },
        ],
      } as SdkLoginView;

      const result = LoginView.fromSdkLoginView(sdkLoginView);

      expect(result.fido2Credentials).toHaveLength(1);
      expect(result.fido2Credentials[0]).toMatchObject({
        credentialId: "cred-id",
        keyValue: "decrypted-key-value",
        rpId: "bitwarden.com",
        counter: 2,
        discoverable: true,
        creationDate: new Date("2025-01-01T01:06:40.441Z"),
      });
    });

    it("should default FIDO2 credentials to an empty array", () => {
      jest.spyOn(LoginUriView, "fromSdkLoginUriView").mockImplementation(mockFromSdk);

      const result = LoginView.fromSdkLoginView({} as SdkLoginView);

      expect(result.fido2Credentials).toEqual([]);
    });
  });

  describe("toSdkLoginView", () => {
    it("should convert populated fields", () => {
      const loginView = new LoginView();
      loginView.username = "user";
      loginView.password = "pass";
      loginView.totp = "TOTP_SEED";

      const result = loginView.toSdkLoginView();

      expect(result.username).toBe("user");
      expect(result.password).toBe("pass");
      expect(result.totp).toBe("TOTP_SEED");
    });

    it("should convert empty username and password to undefined", () => {
      const loginView = new LoginView();
      loginView.username = "";
      loginView.password = "";
      loginView.totp = "";

      const result = loginView.toSdkLoginView();

      expect(result.username).toBeUndefined();
      expect(result.password).toBeUndefined();
      expect(result.totp).toBeUndefined();
    });

    it("should convert null/undefined fields to undefined", () => {
      const loginView = new LoginView();
      loginView.username = undefined;
      loginView.password = undefined;
      loginView.totp = undefined;

      const result = loginView.toSdkLoginView();

      expect(result.username).toBeUndefined();
      expect(result.password).toBeUndefined();
      expect(result.totp).toBeUndefined();
    });
  });
});
