from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class MCPClient:
    """Thin wrapper around an MCP ClientSession that launches a server as a
    subprocess over stdio. The AsyncExitStack keeps the subprocess and the
    session alive until cleanup() so callers don't juggle nested `async with`."""

    def __init__(self, command: str, args: list[str]):
        self._params = StdioServerParameters(command=command, args=args)
        self._exit_stack = AsyncExitStack()
        self._session: ClientSession | None = None

    async def connect(self):
        read, write = await self._exit_stack.enter_async_context(
            stdio_client(self._params)
        )
        self._session = await self._exit_stack.enter_async_context(
            ClientSession(read, write)
        )
        await self._session.initialize()

    def session(self) -> ClientSession:
        if self._session is None:
            raise ConnectionError("MCPClient is not connected. Call connect() first.")
        return self._session

    async def list_tools(self):
        result = await self.session().list_tools()
        return result.tools

    async def call_tool(self, tool_name: str, tool_input: dict):
        return await self.session().call_tool(tool_name, tool_input)

    async def cleanup(self):
        await self._exit_stack.aclose()
        self._session = None

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, *exc):
        await self.cleanup()