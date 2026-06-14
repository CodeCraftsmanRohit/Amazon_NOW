"""
Provider-agnostic LLM factory.

The reasoning pipeline never imports a specific vendor directly — it asks this
module for a chat model. The provider is chosen by the LLM_PROVIDER env var:

    LLM_PROVIDER=openai   (DEFAULT)  → OpenAI GPT-4o   [requires: langchain-openai]
    LLM_PROVIDER=bedrock             → Amazon Bedrock  [requires: langchain-aws]

Design guarantees:
  • OpenAI is the default. If LLM_PROVIDER is unset, behaviour is identical to
    before this module existed — the OpenAI path is 100% unchanged.
  • Imports are LAZY. The Bedrock SDK (langchain-aws / boto3) is only imported
    when LLM_PROVIDER=bedrock. So a machine without langchain-aws installed runs
    the OpenAI path with zero impact.
  • Switching providers is a single env-var flip — no code change.

Bedrock is the documented production target so customer data stays inside AWS.
"""

import os

# Default model ids per provider (override via env if needed).
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


def get_provider() -> str:
    """Return the active provider name ('openai' by default)."""
    return os.getenv("LLM_PROVIDER", "openai").strip().lower()


def get_chat_model(temperature: float = 0):
    """
    Return a LangChain chat model for the active provider.

    Both ChatOpenAI and ChatBedrock expose the same interface
    (`.with_structured_output(...).ainvoke(...)`), so the pipeline code
    is identical regardless of which one is returned.
    """
    provider = get_provider()

    if provider == "bedrock":
        # Lazy import — only loaded when explicitly using Bedrock.
        from langchain_aws import ChatBedrock
        return ChatBedrock(
            model_id=BEDROCK_MODEL_ID,
            region_name=AWS_REGION,
            model_kwargs={"temperature": temperature},
        )

    # ── Default: OpenAI (unchanged path) ─────────────────────────────────────
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(model=OPENAI_MODEL, temperature=temperature)
