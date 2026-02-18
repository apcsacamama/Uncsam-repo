#!/usr/bin/env python3
"""
Test script to verify Gemini API key status, quota, and connectivity.
Tests if the API key is leaked, quota is reached, or key is valid.
"""

import os
import sys
import json
from typing import Dict, Tuple
import requests


class GeminiAPITester:
    """Test Gemini API connectivity and quota status."""
    
    def __init__(self, api_key: str = None):
        """Initialize the tester with API key."""
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model = "gemini-2.5-flash"
        
        if not self.api_key:
            print("❌ ERROR: GEMINI_API_KEY environment variable not set")
            sys.exit(1)
    
    def test_connectivity(self) -> Tuple[bool, str]:
        """Test basic API connectivity."""
        try:
            url = f"{self.base_url}:list?key={self.api_key}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                return True, "✅ API connectivity test PASSED"
            elif response.status_code == 401:
                return False, "❌ AUTHENTICATION FAILED: Invalid or leaked API key"
            elif response.status_code == 403:
                return False, "❌ FORBIDDEN: API key doesn't have required permissions"
            elif response.status_code == 429:
                return False, "⚠️  QUOTA EXCEEDED: Rate limit reached"
            else:
                error_msg = response.json().get("error", {}).get("message", "Unknown error")
                return False, f"❌ ERROR ({response.status_code}): {error_msg}"
        except requests.exceptions.Timeout:
            return False, "❌ CONNECTION TIMEOUT: Unable to reach Gemini API"
        except requests.exceptions.ConnectionError:
            return False, "❌ CONNECTION ERROR: Check your internet connection"
        except Exception as e:
            return False, f"❌ UNEXPECTED ERROR: {str(e)}"
    
    def test_generate_content(self) -> Tuple[bool, str]:
        """Test actual content generation to check quota."""
        try:
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": "Say 'Test successful' in one word"}
                        ]
                    }
                ]
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return True, "✅ Content generation test PASSED"
            elif response.status_code == 401:
                return False, "❌ AUTHENTICATION FAILED: API key is invalid or leaked"
            elif response.status_code == 403:
                return False, "❌ QUOTA EXCEEDED or PERMISSION DENIED"
            elif response.status_code == 429:
                return False, "⚠️  RATE LIMIT EXCEEDED: Too many requests"
            elif response.status_code == 400:
                error_msg = response.json().get("error", {}).get("message", "Bad request")
                if "quota" in error_msg.lower():
                    return False, "⚠️  QUOTA EXCEEDED: " + error_msg
                return False, f"❌ BAD REQUEST: {error_msg}"
            else:
                error_msg = response.json().get("error", {}).get("message", "Unknown error")
                return False, f"❌ ERROR ({response.status_code}): {error_msg}"
        except requests.exceptions.Timeout:
            return False, "❌ TIMEOUT: Request took too long to complete"
        except requests.exceptions.ConnectionError:
            return False, "❌ CONNECTION ERROR: Unable to reach API"
        except Exception as e:
            return False, f"❌ UNEXPECTED ERROR: {str(e)}"
    
    def check_key_exposure(self) -> Tuple[bool, str]:
        """Check if API key contains suspicious patterns."""
        if not self.api_key or len(self.api_key) < 20:
            return False, "⚠️  WARNING: API key looks too short or invalid"
        
        # Common patterns for valid Gemini API keys
        if self.api_key.startswith("AIza"):
            return True, "✅ API key format appears valid"
        
        return False, "⚠️  WARNING: API key format looks unusual"
    
    def run_all_tests(self) -> Dict[str, Tuple[bool, str]]:
        """Run all diagnostic tests."""
        print("\n" + "="*60)
        print("🔍 GEMINI API DIAGNOSTIC TEST")
        print("="*60)
        
        results = {}
        
        # Test 1: Key format
        print("\n[1/3] Checking API key format...")
        results["key_format"] = self.check_key_exposure()
        print(f"      {results['key_format'][1]}")
        
        # Test 2: Connectivity
        print("\n[2/3] Testing API connectivity...")
        results["connectivity"] = self.test_connectivity()
        print(f"      {results['connectivity'][1]}")
        
        # Test 3: Content generation (quota check)
        print("\n[3/3] Testing content generation (quota check)...")
        results["quota"] = self.test_generate_content()
        print(f"      {results['quota'][1]}")
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        all_passed = all(result[0] for result in results.values())
        
        if all_passed:
            print("✅ All tests PASSED! Your Gemini API is working correctly.")
            return_code = 0
        else:
            print("❌ Some tests FAILED. Check the details above.")
            return_code = 1
        
        print("\nDetailed Results:")
        print(f"  • Key Format:      {results['key_format'][1]}")
        print(f"  • Connectivity:    {results['connectivity'][1]}")
        print(f"  • Content Gen:     {results['quota'][1]}")
        print("="*60 + "\n")
        
        return results


def main():
    """Main entry point."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    tester = GeminiAPITester(api_key)
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(result[0] for result in results.values())
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
