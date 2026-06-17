import { PrismaClient, Sender } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const conversation = await prisma.conversation.create({
    data: {
      title: "Order shipping inquiry",
      messages: {
        create: [
          {
            sender: Sender.USER,
            text: "Hi, I placed an order yesterday. How long will shipping take?",
            createdAt: new Date("2026-06-16T10:00:00Z"),
          },
          {
            sender: Sender.ASSISTANT,
            text: "Hello! Thanks for reaching out. We offer worldwide shipping, and most orders are delivered within 3–5 business days from the date of dispatch. Could you share your order number so I can look into the specifics for you?",
            promptTokens: 120,
            completionTokens: 48,
            createdAt: new Date("2026-06-16T10:00:05Z"),
          },
          {
            sender: Sender.USER,
            text: "It's order #4821. Also, what's your return policy in case the item doesn't fit?",
            createdAt: new Date("2026-06-16T10:01:00Z"),
          },
          {
            sender: Sender.ASSISTANT,
            text: "Thanks for that! I'll look into order #4821 for you. Regarding returns — we have a 30-day refund policy. If the item doesn't fit or you're not satisfied, you can initiate a return within 30 days of delivery for a full refund. Just make sure the item is in its original condition.",
            promptTokens: 210,
            completionTokens: 72,
            createdAt: new Date("2026-06-16T10:01:06Z"),
          },
          {
            sender: Sender.USER,
            text: "Great, and what if I need help on the weekend?",
            createdAt: new Date("2026-06-16T10:02:00Z"),
          },
          {
            sender: Sender.ASSISTANT,
            text: "Our support team is available Monday through Friday, 9 AM to 6 PM IST. We're not available on weekends, but if you send us a message, we'll get back to you first thing on Monday morning!",
            promptTokens: 340,
            completionTokens: 45,
            createdAt: new Date("2026-06-16T10:02:04Z"),
          },
        ],
      },
    },
  });

  console.log(`Seeded conversation: ${conversation.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
