// import twilio from 'twilio';

// export const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendWhatsAppLeadAlert = async (sellerPhone: string, leadData: { buyerName: string, propertyTitle: string, message: string }) => {
    try {
        // Enforce Twilio configuration bounds when API Key initializes locally.
        /*
        await twilioClient.messages.create({
            body: `Realistate Alert! You have a new lead for ${leadData.propertyTitle}. ${leadData.buyerName} says: "${leadData.message}". Please check your Seller Dashboard.`,
            from: 'whatsapp:+14155238886', // Twilio Sandbox Number
            to: `whatsapp:${sellerPhone}`
        });
        */
        
        console.log(`[WHATSAPP TWILIO MOCK] Message deployed successfully to ${sellerPhone} for property ${leadData.propertyTitle}`);
    } catch (error) {
        console.error('Twilio WhatsApp API mapping fault:', error);
    }
};
