import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    console.log('--- Clerk Webhook Received ---');

    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('CRITICAL: CLERK_WEBHOOK_SECRET is missing from process.env');
        return new Response('Error occured -- no webhook secret', {
            status: 500
        });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    console.log('Headers:', { svix_id, svix_timestamp, has_signature: !!svix_signature });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('Error: Missing svix headers');
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
        console.log('Webhook signature verified successfully');
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        });
    }

    // Handle the event
    const eventType = evt.type;
    console.log(`Processing event type: ${eventType}`);

    try {
        if (eventType === 'user.created') {
            const { id, email_addresses, first_name, last_name } = evt.data;
            const email = email_addresses?.[0]?.email_address;

            console.log(`User created event data:`, { id, email, first_name, last_name });

            if (!email) {
                return new Response('Error occurred -- no email found', { status: 400 });
            }

            // Find any company that is not the 'Default Company' first
            let company = await prisma.company.findFirst({
                where: {
                    name: { not: 'Default Company' },
                    deletedAt: null
                },
                orderBy: { createdAt: 'asc' }
            });

            // Fallback to 'Default Company' if no other exists
            if (!company) {
                company = await prisma.company.findFirst({
                    where: { name: 'Default Company' }
                });
            }

            if (!company) {
                console.error('CRITICAL: No Company found in DB');
                return new Response('Error occurred -- internal setup incomplete', { status: 500 });
            }

            let department = await prisma.department.findFirst({
                where: {
                    companyId: company.id,
                    name: 'General'
                }
            });

            // Fallback to any department if 'General' doesn't exist
            if (!department) {
                console.log('General department not found, falling back to any available department');
                department = await prisma.department.findFirst({
                    where: { companyId: company.id }
                });
            }

            if (!department) {
                console.error('CRITICAL: No department found in DB for company', company.id);
                return new Response('Error occurred -- internal setup incomplete', { status: 500 });
            }

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({ where: { clerkId: id } });
            if (existingUser) {
                console.log(`User ${id} already exists, skipping creation.`);
                return new Response('User already exists', { status: 200 });
            }

            // Create user in database
            const newUser = await prisma.user.create({
                data: {
                    clerkId: id,
                    email: email,
                    name: first_name ?? 'Unknown',
                    lastname: last_name ?? 'Unknown',
                    companyId: company.id,
                    departmentId: department.id,
                    defaultRoleId: company.defaultRoleId,
                    activated: true,
                    // First user could be admin? For now stick to default false
                    isAdmin: false,
                }
            });

            console.log(`SUCCESS: User created in DB: ${newUser.email} (${newUser.id})`);
        }

        if (eventType === 'user.updated') {
            const { id, email_addresses, first_name, last_name } = evt.data;
            const email = email_addresses?.[0]?.email_address;

            await prisma.user.update({
                where: { clerkId: id },
                data: {
                    email: email,
                    name: first_name ?? undefined,
                    lastname: last_name ?? undefined,
                }
            });

            console.log(`User updated in DB: ${id}`);
        }

        if (eventType === 'user.deleted') {
            const { id } = evt.data;

            if (id) {
                // Soft delete implementation
                await prisma.user.update({
                    where: { clerkId: id },
                    data: {
                        deletedAt: new Date(),
                        activated: false
                    }
                });
                console.log(`User soft-deleted in DB: ${id}`);
            }
        }
    } catch (error) {
        console.error(`Error processing webhook ${eventType}:`, error);
        return new Response('Error processing webhook', { status: 500 });
    }

    return new Response('Webhook processed successfully', { status: 200 });
}

