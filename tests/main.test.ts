import { describe, expect, test } from "vitest";
import { getMapIdFromQueryString } from "../src/utils.js";

describe("getMapIdFromQueryString", () => {
  test("extracts webmap when present and correctly cased", () => {
    expect(getMapIdFromQueryString("http://example.com?webmap=123")).toBe(
      "123"
    );
  });

  test("is case-insensitive to webmap", () => {
    expect(getMapIdFromQueryString("http://example.com?WEBMAP=abc")).toBe(
      "abc"
    );
  });

  test("returns null when webmap is not present", () => {
    expect(getMapIdFromQueryString("http://example.com?param=123")).toBeNull();
  });

  test("accepts URL as a string", () => {
    expect(getMapIdFromQueryString("http://example.com?webmap=string")).toBe(
      "string"
    );
  });

  test("accepts URL as URL object", () => {
    const url = new URL("http://example.com?webmap=object");
    expect(getMapIdFromQueryString(url)).toBe("object");
  });

  test("handles invalid URL strings gracefully", () => {
    expect(() => getMapIdFromQueryString("not-a-valid-url")).toThrow();
  });

  test("ignores unrelated query parameters", () => {
    const url = "http://example.com?other=param&webmap=mixed&extra=param";
    expect(getMapIdFromQueryString(url)).toBe("mixed");
  });
});
