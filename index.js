// Tutorial del cliente de Open Payments
// Objetivo: Realizar un pago entre pares entre dos direcciones de billetera (usando cuentas en la cuenta de prueba)

// Configuración inicial
import { createAuthenticatedClient, isFinalizedGrant } from "@interledger/open-payments";
import fs from "fs/promises";

// a. Importar dependencias y configurar el cliente
(async () => {
  try {
    // c. Cargar la clave privada del archivo
    const privateKey = await fs.readFile("./private.key", "utf8");

    // b. Crear una instancia del cliente Open Payments
    const client = await createAuthenticatedClient({
      walletAddressUrl: "https://ilp.interledger-test.dev/mvr-unos",
      privateKey: 'private.key',
      keyId: "5d10134f-b8d2-4f04-b44a-ddf479915d34",
    });

    // d. Configurar las direcciones de las billeteras del remitente y el receptor

    // 1. Obtener una concesión para un pago entrante
    const sendingWalletAddress = await client.walletAddress.get({
      url: "https://ilp.interledger-test.dev/tammystest",
    });

    const receivingWalletAddress = await client.walletAddress.get({
      url: "https://ilp.interledger-test.dev/hugostest",
    });

    console.log(sendingWalletAddress, receivingWalletAddress);

    // 2. Obtener una concesión para un pago entrante
    const incomingPaymentGrant = await client.grant.request(
        {
            url: receivingWalletAddress.authServer,
        },
        {
            access_token: {
                access: [
                    {
                        type:"incoming-payment",
                        actions: ["create"], 
                    }
                ]
            }
        }
    );

    if (!isFinalizedGrant(incomingPaymentGrant)) {
        throw new Error("Se espera que finalice la concesión");
    }
    console.log(incomingPaymentGrant);

    // 3. Crear un pago entrante para el receptor
    const incomingPayment = await client.incomingPayment.create(
        {
        url: receivingWalletAddress.resourceServer,
        accessToken: incomingPaymentGrant.access_token.value,
        },
        {
            walletAddress: receivingWalletAddress.id,
            incomingAmount: {
                assetCode: receivingWalletAddress.assetCode,
                assetScale: receivingWalletAddress.assetScale,
                value: "1000",
            },
        }
    );
    console.log({incomingPayment});
    // 4. Crear un concesión para una cotización
    const quoteGrant = await client.grant.request(
        {
            url: sendingWalletAddress.authServer,
        },
        {
            access_token: {
                access: [
                    {
                        type:"quote",
                        actions: ["create"], 
                    }
                ]
            }
        }
    );
    if (!isFinalizedGrant(quoteGrant)) {
        throw new Error("Se espera que finalice la concesión");
    }
    console.log(quoteGrant);

    // 5. Obtener una cotización para el remitente
    const quote = await client.quote.create(
        {
            url: receivingWalletAddress.resourceServer,
            accessToken: quoteGrant.access_token.value, 
        },
        {
            walletAddress: sendingWalletAddress.id,
            receiver: incomingPayment.id,
            method:"ilp",
        }
    );
    console.log({quote});

    // 6. Obtener una concesión para un pago saliente
    // 7. Continuar con la concesión del pago saliente
    // 8. Finalizar la concesión del pago saliente
    // 9. Continuar con la cotización de pago saliente

  } catch (err) {
    console.error("Error:", err);
  }
})();
