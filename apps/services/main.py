import asyncio
import json
import os
import asyncpg
import aio_pika
from fastapi import FastAPI

app = FastAPI()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbit:rabbit@localhost:5672")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/data_extraction")


@app.get("/health")
def health():
    return {"status": "ok"}


async def process_document(submission_id: str, document_path: str):
    # TODO: implement LLM processing
    print(f"Processing document {document_path} for submission {submission_id}")

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(
            "UPDATE \"Submission\" SET status = 'DONE', \"updatedAt\" = NOW() WHERE id = $1",
            submission_id,
        )
    finally:
        await conn.close()


async def consume():
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()

    exchange = await channel.declare_exchange("document", aio_pika.ExchangeType.DIRECT, durable=True)
    queue = await channel.declare_queue("document.process", durable=True)
    await queue.bind(exchange, routing_key="document.process")

    async with queue.iterator() as iterator:
        async for message in iterator:
            async with message.process():
                payload = json.loads(message.body)
                await process_document(
                    payload["submissionId"],
                    payload["documentPath"],
                )


@app.on_event("startup")
async def startup():
    asyncio.create_task(consume())
