import os
import asyncio
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from browser_use import Agent, ChatOpenAI
import uvicorn

load_dotenv()

app = FastAPI(title="Browser Agent Service", version="1.0.0")

class BrowserTaskRequest(BaseModel):
    task: str
    app_url: Optional[str] = None
    headless: bool = True
    max_turns: int = 10

class BrowserTaskResponse(BaseModel):
    success: bool
    result: str
    error: Optional[str] = None
    task_id: str

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "browser-agent"}

@app.post("/browse", response_model=BrowserTaskResponse)
async def browse_web(request: BrowserTaskRequest):
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        agent = Agent(
            task=request.task,
            llm=llm,
            headless=request.headless,
            max_turns=request.max_turns
        )
        
        # Execute the task
        result = await agent.run()
        
        return BrowserTaskResponse(
            success=True,
            result=str(result),
            task_id=f"task_{hash(request.task)}"
        )
        
    except Exception as e:
        return BrowserTaskResponse(
            success=False,
            result="",
            error=str(e),
            task_id=f"task_{hash(request.task)}"
        )

@app.post("/scroll-app", response_model=BrowserTaskResponse)
async def scroll_through_app(request: BrowserTaskRequest):
    if not request.app_url:
        raise HTTPException(status_code=400, detail="app_url is required for scrolling")
    
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        scroll_task = f"""
        Navigate to {request.app_url} and perform a comprehensive exploration:
        
        1. First, take a screenshot to see the initial state
        2. Scroll through the entire application systematically:
           - Scroll down page by page
           - Look for navigation menus, buttons, and interactive elements
           - Click on different sections/links to explore different pages
           - Document all the pages and features you discover
        3. For each page/section you visit:
           - Take a screenshot
           - Extract the page content and structure
           - Note any forms, buttons, or interactive elements
           - Document the URL and page title
        4. Create a comprehensive summary of:
           - All pages visited
           - Key features and functionality discovered
           - Navigation structure
           - Interactive elements found
           - Any forms or user inputs available
        
        Be thorough and systematic in your exploration. Take your time to scroll through everything.
        """
        
        agent = Agent(
            task=scroll_task,
            llm=llm,
            headless=request.headless,
            max_turns=request.max_turns
        )
        
        result = await agent.run()
        
        return BrowserTaskResponse(
            success=True,
            result=str(result),
            task_id=f"scroll_{hash(request.app_url)}"
        )
        
    except Exception as e:
        return BrowserTaskResponse(
            success=False,
            result="",
            error=str(e),
            task_id=f"scroll_{hash(request.app_url)}"
        )

@app.post("/search-document", response_model=BrowserTaskResponse)
async def search_document(request: BrowserTaskRequest):
    if not request.app_url:
        raise HTTPException(status_code=400, detail="app_url is required for document search")
    
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        search_task = f"""
        Navigate to {request.app_url} and search for the following: "{request.task}"
        
        Perform a thorough search by:
        1. Using any search functionality on the site
        2. Browsing through different sections and pages
        3. Looking for relevant content, documentation, or information
        4. Extracting and summarizing any relevant findings
        5. Providing specific URLs where the information was found
        
        Focus on finding comprehensive information related to: {request.task}
        """
        
        agent = Agent(
            task=search_task,
            llm=llm,
            headless=request.headless,
            max_turns=request.max_turns
        )
        
        # do the search task
        result = await agent.run()
        
        return BrowserTaskResponse(
            success=True,
            result=str(result),
            task_id=f"search_{hash(request.task)}"
        )
        
    except Exception as e:
        return BrowserTaskResponse(
            success=False,
            result="",
            error=str(e),
            task_id=f"search_{hash(request.task)}"
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3005))
    uvicorn.run(app, host="0.0.0.0", port=port)
