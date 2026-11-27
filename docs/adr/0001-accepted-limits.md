# Accepted limits

Order prices are calculated by the server just before the save transaction. An owner edit in the brief interval before the save can leave the order with the price the shopper saw.

The admin order list shows the newest 1,000 orders. Search covers only those orders.

A checkout retry for an unchanged cart reuses its checkout id. If the first attempt was saved but its response was lost and prices changed before the retry, the retry returns the saved order with the prices from the first attempt, and the WhatsApp message shows those saved prices.
