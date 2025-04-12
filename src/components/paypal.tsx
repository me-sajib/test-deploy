import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

export function Paypal() {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <>
      {isPending && <h2>Load Smart Payment Button...</h2>}
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: '0.01',
                },
              },
            ],
          });
        }}
        onApprove={(data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            alert(
              'Transaction completed by ' +
                (details?.payer?.name?.given_name ?? 'No details')
            );
            alert('Data details: ' + JSON.stringify(data, null, 2));
          });
        }}
      />
    </>
  );
}
