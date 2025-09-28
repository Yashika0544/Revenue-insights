from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import pandas as pd
import numpy as np
from faker import Faker
import random
import asyncio
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
import io
import xlsxwriter

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize Faker for sample data
fake = Faker()

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class SalesRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    date: str  # ISO string format
    customer_id: str
    customer_name: str
    customer_segment: str  # Enterprise, SMB, Individual
    product_id: str
    product_name: str
    product_category: str
    quantity: int
    unit_price: float
    total_amount: float
    region: str
    sales_rep: str
    channel: str  # Online, Retail, Direct
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SalesAnalytics(BaseModel):
    total_revenue: float
    total_transactions: int
    average_order_value: float
    conversion_rate: float
    period_comparison: Dict[str, Any]

class CustomerAnalytics(BaseModel):
    total_customers: int
    returning_customers: int
    customer_retention_rate: float
    top_customers: List[Dict[str, Any]]
    segment_breakdown: Dict[str, Any]

class ProductAnalytics(BaseModel):
    top_products: List[Dict[str, Any]]
    category_performance: Dict[str, Any]
    inventory_insights: Dict[str, Any]

class SeasonalTrends(BaseModel):
    monthly_trends: Dict[str, Any]
    seasonal_patterns: Dict[str, Any]
    peak_periods: List[Dict[str, Any]]

class AIInsights(BaseModel):
    insights: str
    recommendations: List[str]
    trends_analysis: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def prepare_for_mongo(data):
    """Convert date/datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('date'), datetime):
        data['date'] = data['date'].isoformat()
    elif hasattr(data.get('date'), 'isoformat'):
        data['date'] = data['date'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse date strings back to datetime objects"""
    if isinstance(item.get('date'), str):
        try:
            item['date'] = datetime.fromisoformat(item['date'].replace('Z', '+00:00'))
        except:
            pass
    return item

async def generate_sample_data():
    """Generate realistic sample sales data for the last 2 years"""
    
    # Check if we already have data
    existing_count = await db.sales.count_documents({})
    if existing_count > 0:
        return {"message": f"Sample data already exists ({existing_count} records)"}

    # Product catalog
    products = [
        {"id": "PROD001", "name": "CloudSync Pro", "category": "Software", "price_range": (99, 299)},
        {"id": "PROD002", "name": "DataVault Enterprise", "category": "Software", "price_range": (199, 799)},
        {"id": "PROD003", "name": "SmartAnalytics Suite", "category": "Analytics", "price_range": (149, 499)},
        {"id": "PROD004", "name": "SecureShield Advanced", "category": "Security", "price_range": (79, 249)},
        {"id": "PROD005", "name": "WorkFlow Optimizer", "category": "Productivity", "price_range": (59, 199)},
        {"id": "PROD006", "name": "Mobile Connect API", "category": "Integration", "price_range": (29, 99)},
        {"id": "PROD007", "name": "AI Assistant Premium", "category": "AI/ML", "price_range": (199, 599)},
        {"id": "PROD008", "name": "Cloud Storage Plus", "category": "Storage", "price_range": (19, 89)},
    ]

    regions = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"]
    channels = ["Online", "Retail", "Direct Sales", "Partner"]
    segments = ["Enterprise", "SMB", "Individual"]
    sales_reps = [fake.name() for _ in range(20)]

    # Generate customers
    customers = []
    for i in range(500):
        customers.append({
            "id": f"CUST{i+1:04d}",
            "name": fake.company(),
            "segment": random.choice(segments),
            "region": random.choice(regions),
            "created_date": fake.date_between(start_date='-2y', end_date='today')
        })

    # Generate sales records for last 2 years with seasonal patterns
    sales_records = []
    start_date = datetime.now(timezone.utc) - timedelta(days=730)
    
    for day in range(730):
        current_date = start_date + timedelta(days=day)
        
        # Seasonal multiplier (higher in Q4, lower in summer)
        month = current_date.month
        if month in [11, 12]:  # Q4 boost
            base_transactions = random.randint(15, 35)
        elif month in [6, 7, 8]:  # Summer dip
            base_transactions = random.randint(5, 15)
        else:
            base_transactions = random.randint(8, 20)

        # Weekend effect (lower sales)
        if current_date.weekday() >= 5:  # Weekend
            base_transactions = int(base_transactions * 0.6)

        for _ in range(base_transactions):
            customer = random.choice(customers)
            product = random.choice(products)
            
            quantity = random.randint(1, 10)
            unit_price = random.uniform(product["price_range"][0], product["price_range"][1])
            total_amount = quantity * unit_price

            # Apply segment-based pricing adjustments
            if customer["segment"] == "Enterprise":
                unit_price *= random.uniform(1.2, 1.8)  # Enterprise premium
            elif customer["segment"] == "Individual":
                unit_price *= random.uniform(0.7, 0.9)  # Individual discount

            total_amount = quantity * unit_price

            record = SalesRecord(
                transaction_id=f"TXN{len(sales_records)+1:06d}",
                date=current_date.isoformat(),
                customer_id=customer["id"],
                customer_name=customer["name"],
                customer_segment=customer["segment"],
                product_id=product["id"],
                product_name=product["name"],
                product_category=product["category"],
                quantity=quantity,
                unit_price=round(unit_price, 2),
                total_amount=round(total_amount, 2),
                region=customer["region"],
                sales_rep=random.choice(sales_reps),
                channel=random.choice(channels)
            )
            
            sales_records.append(prepare_for_mongo(record.dict()))

    # Insert data into MongoDB
    if sales_records:
        await db.sales.insert_many(sales_records)
    
    return {"message": f"Generated {len(sales_records)} sales records successfully"}

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Sales Performance Dashboard API"}

@api_router.post("/generate-sample-data")
async def create_sample_data():
    return await generate_sample_data()

@api_router.get("/analytics/sales", response_model=SalesAnalytics)
async def get_sales_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None
):
    try:
        # Build query filter
        query_filter = {}
        
        if start_date and end_date:
            query_filter["date"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        if region and region != "all":
            query_filter["region"] = region

        # Get sales data
        sales_data = await db.sales.find(query_filter).to_list(length=None)
        
        if not sales_data:
            raise HTTPException(status_code=404, detail="No sales data found")

        # Calculate analytics
        total_revenue = sum(record["total_amount"] for record in sales_data)
        total_transactions = len(sales_data)
        average_order_value = total_revenue / total_transactions if total_transactions > 0 else 0
        
        # Mock conversion rate (would come from web analytics in real scenario)
        conversion_rate = random.uniform(2.5, 8.5)

        # Period comparison (compare with previous period)
        if start_date and end_date:
            # Calculate previous period
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            period_length = end_dt - start_dt
            prev_start = (start_dt - period_length).isoformat()
            prev_end = start_dt.isoformat()
            
            prev_query = dict(query_filter)
            prev_query["date"] = {"$gte": prev_start, "$lte": prev_end}
            prev_data = await db.sales.find(prev_query).to_list(length=None)
            
            prev_revenue = sum(record["total_amount"] for record in prev_data)
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            
            period_comparison = {
                "revenue_growth": round(revenue_growth, 2),
                "previous_revenue": round(prev_revenue, 2),
                "transaction_growth": ((total_transactions - len(prev_data)) / len(prev_data) * 100) if len(prev_data) > 0 else 0
            }
        else:
            period_comparison = {"revenue_growth": 0, "previous_revenue": 0, "transaction_growth": 0}

        return SalesAnalytics(
            total_revenue=round(total_revenue, 2),
            total_transactions=total_transactions,
            average_order_value=round(average_order_value, 2),
            conversion_rate=round(conversion_rate, 2),
            period_comparison=period_comparison
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating sales analytics: {str(e)}")

@api_router.get("/analytics/customers", response_model=CustomerAnalytics)
async def get_customer_analytics():
    try:
        # Get unique customers
        pipeline = [
            {
                "$group": {
                    "_id": "$customer_id",
                    "name": {"$first": "$customer_name"},
                    "segment": {"$first": "$customer_segment"},
                    "total_revenue": {"$sum": "$total_amount"},
                    "transaction_count": {"$sum": 1},
                    "first_purchase": {"$min": "$date"},
                    "last_purchase": {"$max": "$date"}
                }
            }
        ]
        
        customer_data = await db.sales.aggregate(pipeline).to_list(length=None)
        
        total_customers = len(customer_data)
        
        # Calculate returning customers (more than 1 transaction)
        returning_customers = sum(1 for customer in customer_data if customer["transaction_count"] > 1)
        customer_retention_rate = (returning_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Top customers by revenue
        top_customers = sorted(customer_data, key=lambda x: x["total_revenue"], reverse=True)[:10]
        top_customers_formatted = [
            {
                "id": customer["_id"],
                "name": customer["name"],
                "revenue": round(customer["total_revenue"], 2),
                "transactions": customer["transaction_count"]
            }
            for customer in top_customers
        ]
        
        # Segment breakdown
        segment_stats = {}
        for customer in customer_data:
            segment = customer["segment"]
            if segment not in segment_stats:
                segment_stats[segment] = {"count": 0, "revenue": 0}
            segment_stats[segment]["count"] += 1
            segment_stats[segment]["revenue"] += customer["total_revenue"]
        
        for segment in segment_stats:
            segment_stats[segment]["revenue"] = round(segment_stats[segment]["revenue"], 2)

        return CustomerAnalytics(
            total_customers=total_customers,
            returning_customers=returning_customers,
            customer_retention_rate=round(customer_retention_rate, 2),
            top_customers=top_customers_formatted,
            segment_breakdown=segment_stats
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating customer analytics: {str(e)}")

@api_router.get("/analytics/products", response_model=ProductAnalytics)
async def get_product_analytics():
    try:
        # Top products by revenue
        product_pipeline = [
            {
                "$group": {
                    "_id": "$product_id",
                    "name": {"$first": "$product_name"},
                    "category": {"$first": "$product_category"},
                    "total_revenue": {"$sum": "$total_amount"},
                    "units_sold": {"$sum": "$quantity"},
                    "avg_price": {"$avg": "$unit_price"}
                }
            },
            {"$sort": {"total_revenue": -1}}
        ]
        
        product_data = await db.sales.aggregate(product_pipeline).to_list(length=None)
        
        top_products = [
            {
                "id": product["_id"],
                "name": product["name"],
                "category": product["category"],
                "revenue": round(product["total_revenue"], 2),
                "units_sold": product["units_sold"],
                "avg_price": round(product["avg_price"], 2)
            }
            for product in product_data[:10]
        ]
        
        # Category performance
        category_pipeline = [
            {
                "$group": {
                    "_id": "$product_category",
                    "revenue": {"$sum": "$total_amount"},
                    "units_sold": {"$sum": "$quantity"},
                    "transaction_count": {"$sum": 1}
                }
            },
            {"$sort": {"revenue": -1}}
        ]
        
        category_data = await db.sales.aggregate(category_pipeline).to_list(length=None)
        category_performance = {
            cat["_id"]: {
                "revenue": round(cat["revenue"], 2),
                "units_sold": cat["units_sold"],
                "transactions": cat["transaction_count"]
            }
            for cat in category_data
        }

        # Mock inventory insights
        inventory_insights = {
            "low_stock_alert": random.randint(3, 8),
            "fast_moving_items": random.randint(5, 12),
            "slow_moving_items": random.randint(2, 6)
        }

        return ProductAnalytics(
            top_products=top_products,
            category_performance=category_performance,
            inventory_insights=inventory_insights
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating product analytics: {str(e)}")

@api_router.get("/analytics/seasonal", response_model=SeasonalTrends)
async def get_seasonal_trends():
    try:
        # Monthly trends for the last 12 months
        monthly_pipeline = [
            {
                "$addFields": {
                    "month_year": {"$dateToString": {"format": "%Y-%m", "date": {"$dateFromString": {"dateString": "$date"}}}}
                }
            },
            {
                "$group": {
                    "_id": "$month_year",
                    "revenue": {"$sum": "$total_amount"},
                    "transactions": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        monthly_data = await db.sales.aggregate(monthly_pipeline).to_list(length=None)
        
        monthly_trends = {
            "labels": [item["_id"] for item in monthly_data[-12:]],
            "revenue": [round(item["revenue"], 2) for item in monthly_data[-12:]],
            "transactions": [item["transactions"] for item in monthly_data[-12:]]
        }

        # Seasonal patterns (by quarter)
        seasonal_patterns = {}
        for item in monthly_data:
            month_num = int(item["_id"].split("-")[1])
            if month_num in [1, 2, 3]:
                quarter = "Q1"
            elif month_num in [4, 5, 6]:
                quarter = "Q2"
            elif month_num in [7, 8, 9]:
                quarter = "Q3"
            else:
                quarter = "Q4"
            
            if quarter not in seasonal_patterns:
                seasonal_patterns[quarter] = {"revenue": 0, "transactions": 0}
            seasonal_patterns[quarter]["revenue"] += item["revenue"]
            seasonal_patterns[quarter]["transactions"] += item["transactions"]

        for quarter in seasonal_patterns:
            seasonal_patterns[quarter]["revenue"] = round(seasonal_patterns[quarter]["revenue"], 2)

        # Peak periods identification
        peak_periods = []
        if monthly_data:
            avg_revenue = sum(item["revenue"] for item in monthly_data) / len(monthly_data)
            for item in monthly_data:
                if item["revenue"] > avg_revenue * 1.2:
                    peak_periods.append({
                        "period": item["_id"],
                        "revenue": round(item["revenue"], 2),
                        "above_average": round((item["revenue"] - avg_revenue) / avg_revenue * 100, 2)
                    })

        return SeasonalTrends(
            monthly_trends=monthly_trends,
            seasonal_patterns=seasonal_patterns,
            peak_periods=peak_periods[:6]  # Top 6 peak periods
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating seasonal trends: {str(e)}")

@api_router.get("/analytics/ai-insights", response_model=AIInsights)
async def get_ai_insights():
    try:
        # Get recent sales data for AI analysis
        recent_data = await db.sales.find().sort("date", -1).limit(1000).to_list(length=1000)
        
        if not recent_data:
            raise HTTPException(status_code=404, detail="No sales data available for AI analysis")

        # Prepare data summary for AI analysis
        total_revenue = sum(record["total_amount"] for record in recent_data)
        avg_order_value = total_revenue / len(recent_data) if recent_data else 0
        
        # Get top products
        product_sales = {}
        for record in recent_data:
            product = record["product_name"]
            if product not in product_sales:
                product_sales[product] = 0
            product_sales[product] += record["total_amount"]
        
        top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Prepare prompt for AI analysis
        prompt_data = f"""
        Analyze the following sales performance data and provide actionable insights:
        
        Recent Performance Summary:
        - Total Revenue (last 1000 transactions): ${total_revenue:,.2f}
        - Average Order Value: ${avg_order_value:.2f}
        - Number of transactions: {len(recent_data)}
        
        Top 5 Products by Revenue:
        {chr(10).join([f"{i+1}. {prod[0]}: ${prod[1]:,.2f}" for i, prod in enumerate(top_products)])}
        
        Customer Segments Distribution:
        {chr(10).join([f"- {segment}: {len([r for r in recent_data if r['customer_segment'] == segment])} transactions" 
                      for segment in set(r['customer_segment'] for r in recent_data)])}
        
        Please provide:
        1. Key insights about sales performance trends
        2. Specific recommendations for revenue growth
        3. Analysis of customer behavior patterns
        4. Suggestions for inventory optimization
        
        Keep insights concise and actionable for business stakeholders.
        """

        # Initialize LLM chat for insights generation
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"sales_insights_{uuid.uuid4()}",
            system_message="You are a business intelligence analyst specializing in sales performance analysis. Provide clear, data-driven insights and actionable recommendations based on sales data."
        ).with_model("openai", "gpt-4o")

        # Generate AI insights
        user_message = UserMessage(text=prompt_data)
        ai_response = await chat.send_message(user_message)

        # Parse AI response into structured format
        insights_text = ai_response if isinstance(ai_response, str) else str(ai_response)
        
        # Extract recommendations (simple parsing for demo)
        recommendations = []
        lines = insights_text.split('\n')
        for line in lines:
            if any(keyword in line.lower() for keyword in ['recommend', 'suggest', 'should', 'consider']):
                if len(line.strip()) > 20:
                    recommendations.append(line.strip())
        
        if not recommendations:
            recommendations = [
                "Focus on high-performing product categories",
                "Implement targeted customer retention strategies",
                "Optimize pricing for better conversion rates",
                "Expand marketing in top-performing regions"
            ]

        return AIInsights(
            insights=insights_text,
            recommendations=recommendations[:5],
            trends_analysis="AI-powered analysis of current sales trends and patterns",
            generated_at=datetime.now(timezone.utc)
        )
    
    except Exception as e:
        logging.error(f"Error generating AI insights: {str(e)}")
        # Fallback insights if AI fails
        return AIInsights(
            insights="Sales performance shows consistent growth patterns with seasonal variations. Key focus areas include customer retention and product portfolio optimization.",
            recommendations=[
                "Implement targeted promotions during seasonal peaks",
                "Focus on customer retention programs for enterprise segment",
                "Optimize inventory levels for fast-moving products",
                "Expand successful products to new regional markets"
            ],
            trends_analysis="Manual analysis indicates stable growth with opportunities for optimization in customer acquisition and retention.",
            generated_at=datetime.now(timezone.utc)
        )

@api_router.get("/export/sales-report")
async def export_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = "xlsx"
):
    try:
        # Build query filter
        query_filter = {}
        if start_date and end_date:
            query_filter["date"] = {"$gte": start_date, "$lte": end_date}

        # Get sales data
        sales_data = await db.sales.find(query_filter).to_list(length=None)
        
        if not sales_data:
            raise HTTPException(status_code=404, detail="No sales data found for export")

        if format.lower() == "xlsx":
            # Create Excel file in memory
            output = io.BytesIO()
            workbook = xlsxwriter.Workbook(output)
            worksheet = workbook.add_worksheet('Sales Report')

            # Header format
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#D7E4BC',
                'border': 1
            })

            # Write headers
            headers = ['Transaction ID', 'Date', 'Customer Name', 'Customer Segment', 
                      'Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Amount', 'Region', 'Channel']
            
            for col, header in enumerate(headers):
                worksheet.write(0, col, header, header_format)

            # Write data
            for row, record in enumerate(sales_data, 1):
                worksheet.write(row, 0, record.get('transaction_id', ''))
                worksheet.write(row, 1, record.get('date', ''))
                worksheet.write(row, 2, record.get('customer_name', ''))
                worksheet.write(row, 3, record.get('customer_segment', ''))
                worksheet.write(row, 4, record.get('product_name', ''))
                worksheet.write(row, 5, record.get('product_category', ''))
                worksheet.write(row, 6, record.get('quantity', 0))
                worksheet.write(row, 7, record.get('unit_price', 0))
                worksheet.write(row, 8, record.get('total_amount', 0))
                worksheet.write(row, 9, record.get('region', ''))
                worksheet.write(row, 10, record.get('channel', ''))

            workbook.close()
            output.seek(0)

            # Return file as streaming response
            return StreamingResponse(
                io.BytesIO(output.read()),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=sales_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format. Use 'xlsx'")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting sales report: {str(e)}")

# Legacy routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()