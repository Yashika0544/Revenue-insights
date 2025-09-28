import requests
import sys
import json
from datetime import datetime, timedelta

class SalesDashboardTester:
    def __init__(self, base_url="https://revenue-insights-15.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - {name}")
                
                # Try to parse JSON response for additional validation
                try:
                    json_response = response.json()
                    if isinstance(json_response, dict):
                        print(f"   Response keys: {list(json_response.keys())}")
                    return True, json_response
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - {name}")
                print(f"   Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text[:200]}")
                
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - {name}")
            print(f"   Exception: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_generate_sample_data(self):
        """Test sample data generation"""
        return self.run_test("Generate Sample Data", "POST", "generate-sample-data", 200)

    def test_sales_analytics(self):
        """Test sales analytics endpoint"""
        # Test without parameters
        success1, _ = self.run_test("Sales Analytics (No Params)", "GET", "analytics/sales", 200)
        
        # Test with date range
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        params = {"start_date": start_date, "end_date": end_date}
        success2, _ = self.run_test("Sales Analytics (With Date Range)", "GET", "analytics/sales", 200, params=params)
        
        # Test with region filter
        params = {"region": "North America"}
        success3, _ = self.run_test("Sales Analytics (With Region)", "GET", "analytics/sales", 200, params=params)
        
        return success1 and success2 and success3

    def test_customer_analytics(self):
        """Test customer analytics endpoint"""
        return self.run_test("Customer Analytics", "GET", "analytics/customers", 200)

    def test_product_analytics(self):
        """Test product analytics endpoint"""
        return self.run_test("Product Analytics", "GET", "analytics/products", 200)

    def test_seasonal_trends(self):
        """Test seasonal trends endpoint"""
        return self.run_test("Seasonal Trends", "GET", "analytics/seasonal", 200)

    def test_ai_insights(self):
        """Test AI insights endpoint"""
        print("\n🤖 Testing AI Insights (may take longer due to LLM processing)...")
        return self.run_test("AI Insights", "GET", "analytics/ai-insights", 200)

    def test_export_functionality(self):
        """Test export functionality"""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        params = {"start_date": start_date, "end_date": end_date, "format": "xlsx"}
        
        print(f"\n📊 Testing Export Functionality...")
        url = f"{self.api_url}/export/sales-report"
        
        try:
            response = requests.get(url, params=params, timeout=30)
            self.tests_run += 1
            
            if response.status_code == 200:
                # Check if it's actually an Excel file
                content_type = response.headers.get('content-type', '')
                if 'spreadsheet' in content_type or 'excel' in content_type:
                    print("✅ PASSED - Export Functionality")
                    print(f"   Content-Type: {content_type}")
                    print(f"   Content-Length: {len(response.content)} bytes")
                    self.tests_passed += 1
                    return True
                else:
                    print("❌ FAILED - Export returned wrong content type")
                    print(f"   Content-Type: {content_type}")
                    return False
            else:
                print(f"❌ FAILED - Export returned status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ FAILED - Export exception: {str(e)}")
            return False

    def test_legacy_endpoints(self):
        """Test legacy status endpoints"""
        # Test GET status
        success1, _ = self.run_test("Get Status Checks", "GET", "status", 200)
        
        # Test POST status
        test_data = {"client_name": "test_client"}
        success2, _ = self.run_test("Create Status Check", "POST", "status", 200, data=test_data)
        
        return success1 and success2

def main():
    print("🚀 Starting Sales Dashboard Backend API Tests")
    print("=" * 60)
    
    tester = SalesDashboardTester()
    
    # Run all tests
    test_results = []
    
    print("\n📋 Testing Core API Endpoints...")
    test_results.append(tester.test_root_endpoint())
    
    print("\n📊 Testing Data Generation...")
    test_results.append(tester.test_generate_sample_data())
    
    print("\n📈 Testing Analytics Endpoints...")
    test_results.append(tester.test_sales_analytics())
    test_results.append(tester.test_customer_analytics())
    test_results.append(tester.test_product_analytics())
    test_results.append(tester.test_seasonal_trends())
    
    print("\n🤖 Testing AI Features...")
    test_results.append(tester.test_ai_insights())
    
    print("\n📤 Testing Export Features...")
    test_results.append(tester.test_export_functionality())
    
    print("\n🔧 Testing Legacy Endpoints...")
    test_results.append(tester.test_legacy_endpoints())
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['test']}")
            if 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
            print(f"   Endpoint: {failure['endpoint']}")
    
    # Return appropriate exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())