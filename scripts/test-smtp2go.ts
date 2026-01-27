import { smtp2go } from '@/lib/smtp2go';
import { emailConfig } from '@/lib/email-config';

async function testSMTP2GO() {
    console.log('Testing SMTP2GO configuration...');
    
    if (!smtp2go) {
        console.error('❌ SMTP2GO is not configured. Please check your SMTP2GO_API_KEY environment variable.');
        return false;
    }
    
    console.log('✅ SMTP2GO client initialized successfully');
    
    try {
        // Test email structure
        const mailService = smtp2go.mail()
            .to({ email: 'test@example.com' })
            .from({ email: emailConfig.sender.email, name: emailConfig.sender.name })
            .subject('Test Email from SMTP2GO')
            .html('<h1>SMTP2GO Test</h1><p>This is a test email to verify SMTP2GO integration.</p>');
        
        console.log('✅ Email service structure created successfully');
        console.log('📧 Test email ready to send (commented out to avoid actual sending)');
        console.log('   To: test@example.com');
        console.log(`   From: ${emailConfig.sender.name} <${emailConfig.sender.email}>`);
        console.log('   Subject: Test Email from SMTP2GO');
        
        // Uncomment the following lines to actually send a test email:
        // const { data, error } = await smtp2go.client().consume(mailService);
        // if (error) {
        //     console.error('❌ SMTP2GO error:', error);
        //     return false;
        // } else {
        //     console.log('✅ Email sent successfully:', data);
        //     return true;
        // }
        
        return true;
    } catch (error) {
        console.error('❌ Error creating email service:', error);
        return false;
    }
}

// Run the test
testSMTP2GO().then(success => {
    if (success) {
        console.log('\n🎉 SMTP2GO migration test completed successfully!');
        console.log('📝 Next steps:');
        console.log('   1. Add your actual SMTP2GO_API_KEY to .env files');
        console.log('   2. Verify that manuel.magnani@redify.co is verified in SMTP2GO as a sender');
        console.log('   3. Uncomment the send lines above to test actual email delivery');
    } else {
        console.log('\n❌ SMTP2GO migration test failed. Please check configuration.');
    }
});