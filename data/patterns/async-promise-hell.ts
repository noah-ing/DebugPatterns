import { Pattern } from '../index';

export const asyncPromiseHellPattern: Pattern = {
  id: 'async-promise-hell',
  title: 'Promise Chaining',
  description: 'Visualize and debug complex asynchronous flows and promise chains for structured reasoning and step-by-step task completion.',
  category: 'WORKFLOW',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222927.svg',
  useCases: [
    'Complex data fetching workflows',
    'Multi-step form submissions',
    'Dependent API calls',
    'Resource cleanup chains'
  ],
  implementation: {
    typescript: `// Real-world example: User checkout flow with inventory check, payment, and order creation
interface InventoryCheck {
  productId: string;
  available: boolean;
  quantity: number;
}

interface PaymentResult {
  transactionId: string;
  status: 'success' | 'failed';
  amount: number;
}

interface Order {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  status: 'pending' | 'confirmed' | 'failed';
}

class CheckoutService {
  private logger = console; // Replace with your logging service

  async processCheckout(
    userId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<Order> {
    try {
      // Step 1: Check inventory for all items
      const inventoryChecks = await this.checkInventory(items);
      const unavailableItems = inventoryChecks.filter(check => !check.available);
      
      if (unavailableItems.length > 0) {
        throw new Error(\`Items out of stock: \${unavailableItems.map(item => item.productId).join(', ')}\`);
      }

      // Step 2: Calculate total and process payment
      const total = await this.calculateTotal(items);
      const paymentResult = await this.processPayment(userId, total);

      if (paymentResult.status === 'failed') {
        throw new Error(\`Payment failed for transaction \${paymentResult.transactionId}\`);
      }

      // Step 3: Create order
      const order = await this.createOrder(userId, items, paymentResult);
      
      // Step 4: Update inventory (should be transactional in production)
      await this.updateInventory(items);

      this.logger.info('Checkout completed successfully', {
        orderId: order.orderId,
        userId,
        items: items.length,
        total: paymentResult.amount
      });

      return order;

    } catch (error) {
      this.logger.error('Checkout process failed', {
        userId,
        items: items.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Attempt cleanup/rollback if needed
      await this.handleCheckoutError(error, userId, items);
      
      throw error;
    }
  }

  private async checkInventory(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<InventoryCheck[]> {
    try {
      // Parallel inventory checks for all items
      return await Promise.all(
        items.map(async item => {
          const inventory = await this.inventoryAPI.check(item.productId);
          return {
            productId: item.productId,
            available: inventory.quantity >= item.quantity,
            quantity: inventory.quantity
          };
        })
      );
    } catch (error) {
      this.logger.error('Inventory check failed', { items, error });
      throw new Error('Failed to verify inventory availability');
    }
  }

  private async calculateTotal(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<number> {
    try {
      const prices = await Promise.all(
        items.map(item => this.pricingAPI.get(item.productId))
      );

      return items.reduce((total, item, index) => {
        return total + (prices[index] * item.quantity);
      }, 0);
    } catch (error) {
      this.logger.error('Price calculation failed', { items, error });
      throw new Error('Failed to calculate order total');
    }
  }

  private async processPayment(
    userId: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const paymentResult = await this.paymentAPI.charge({
        userId,
        amount,
        currency: 'USD'
      });

      this.logger.info('Payment processed', {
        userId,
        amount,
        transactionId: paymentResult.transactionId
      });

      return paymentResult;
    } catch (error) {
      this.logger.error('Payment processing failed', {
        userId,
        amount,
        error
      });
      throw new Error('Payment processing failed');
    }
  }

  private async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    payment: PaymentResult
  ): Promise<Order> {
    try {
      const order = await this.orderAPI.create({
        userId,
        items,
        paymentId: payment.transactionId,
        status: 'confirmed'
      });

      this.logger.info('Order created', {
        orderId: order.orderId,
        userId,
        items: items.length
      });

      return order;
    } catch (error) {
      this.logger.error('Order creation failed', {
        userId,
        items,
        paymentId: payment.transactionId,
        error
      });
      throw new Error('Failed to create order');
    }
  }

  private async updateInventory(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<void> {
    try {
      await Promise.all(
        items.map(item =>
          this.inventoryAPI.decrease(item.productId, item.quantity)
        )
      );
    } catch (error) {
      this.logger.error('Inventory update failed', { items, error });
      throw new Error('Failed to update inventory');
    }
  }

  private async handleCheckoutError(
    error: unknown,
    userId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<void> {
    this.logger.warn('Initiating checkout error cleanup', {
      userId,
      items: items.length,
      error
    });

    try {
      // Implement your cleanup/rollback logic here
      // For example:
      // - Refund payment if it was processed
      // - Restore inventory if it was decreased
      // - Update order status if it was created
    } catch (cleanupError) {
      this.logger.error('Cleanup after checkout failure failed', {
        originalError: error,
        cleanupError
      });
    }
  }
}

// Usage Example
async function handleUserCheckout(userId: string, cartItems: CartItem[]) {
  const checkoutService = new CheckoutService();
  
  try {
    const order = await checkoutService.processCheckout(userId, cartItems);
    
    // Handle successful checkout
    notifyUser(userId, {
      type: 'checkout_success',
      orderId: order.orderId
    });
    
  } catch (error) {
    // Handle checkout failure
    notifyUser(userId, {
      type: 'checkout_failed',
      error: error instanceof Error ? error.message : 'Checkout failed'
    });
    
    // Redirect to error page or show error message
    throw error;
  }
}`,
    python: `# Real-world example: User checkout flow with inventory check, payment, and order creation
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
import logging
import asyncio
from enum import Enum

class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"

@dataclass
class CartItem:
    product_id: str
    quantity: int

@dataclass
class InventoryCheck:
    product_id: str
    available: bool
    quantity: int

@dataclass
class PaymentResult:
    transaction_id: str
    status: str
    amount: float

@dataclass
class Order:
    order_id: str
    user_id: str
    items: List[CartItem]
    status: OrderStatus
    created_at: datetime

class CheckoutError(Exception):
    """Base exception for checkout process errors"""
    pass

class InventoryError(CheckoutError):
    """Raised when inventory check fails"""
    pass

class PaymentError(CheckoutError):
    """Raised when payment processing fails"""
    pass

class OrderError(CheckoutError):
    """Raised when order creation fails"""
    pass

class CheckoutService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def process_checkout(
        self,
        user_id: str,
        items: List[CartItem]
    ) -> Order:
        """
        Process a user's checkout, handling inventory, payment, and order creation.
        
        Args:
            user_id: The ID of the user making the purchase
            items: List of items in the cart
            
        Returns:
            Order: The created order if successful
            
        Raises:
            InventoryError: If items are not available
            PaymentError: If payment processing fails
            OrderError: If order creation fails
        """
        try:
            # Step 1: Check inventory
            inventory_checks = await self._check_inventory(items)
            unavailable = [
                check for check in inventory_checks 
                if not check.available
            ]
            
            if unavailable:
                raise InventoryError(
                    f"Items out of stock: {', '.join(i.product_id for i in unavailable)}"
                )

            # Step 2: Calculate total and process payment
            total = await self._calculate_total(items)
            payment = await self._process_payment(user_id, total)

            if payment.status != "success":
                raise PaymentError(
                    f"Payment failed: {payment.transaction_id}"
                )

            # Step 3: Create order
            order = await self._create_order(user_id, items, payment)
            
            # Step 4: Update inventory
            await self._update_inventory(items)

            self.logger.info(
                "Checkout completed successfully",
                extra={
                    "order_id": order.order_id,
                    "user_id": user_id,
                    "items_count": len(items),
                    "total": payment.amount
                }
            )

            return order

        except Exception as error:
            self.logger.error(
                "Checkout process failed",
                extra={
                    "user_id": user_id,
                    "items_count": len(items),
                    "error": str(error)
                },
                exc_info=True
            )

            # Attempt cleanup/rollback
            await self._handle_checkout_error(error, user_id, items)
            
            raise

    async def _check_inventory(
        self,
        items: List[CartItem]
    ) -> List[InventoryCheck]:
        """Check inventory availability for all items"""
        try:
            # Parallel inventory checks
            checks = await asyncio.gather(*[
                self.inventory_api.check(item.product_id)
                for item in items
            ])
            
            return [
                InventoryCheck(
                    product_id=item.product_id,
                    available=check.quantity >= item.quantity,
                    quantity=check.quantity
                )
                for item, check in zip(items, checks)
            ]
            
        except Exception as error:
            self.logger.error(
                "Inventory check failed",
                extra={"items": items},
                exc_info=True
            )
            raise InventoryError("Failed to verify inventory") from error

    async def _calculate_total(
        self,
        items: List[CartItem]
    ) -> float:
        """Calculate total price for all items"""
        try:
            # Fetch prices in parallel
            prices = await asyncio.gather(*[
                self.pricing_api.get_price(item.product_id)
                for item in items
            ])
            
            return sum(
                price * item.quantity
                for price, item in zip(prices, items)
            )
            
        except Exception as error:
            self.logger.error(
                "Price calculation failed",
                extra={"items": items},
                exc_info=True
            )
            raise CheckoutError("Failed to calculate total") from error

    async def _process_payment(
        self,
        user_id: str,
        amount: float
    ) -> PaymentResult:
        """Process payment for the order"""
        try:
            result = await self.payment_api.charge({
                "user_id": user_id,
                "amount": amount,
                "currency": "USD"
            })

            self.logger.info(
                "Payment processed",
                extra={
                    "user_id": user_id,
                    "amount": amount,
                    "transaction_id": result.transaction_id
                }
            )

            return result
            
        except Exception as error:
            self.logger.error(
                "Payment processing failed",
                extra={
                    "user_id": user_id,
                    "amount": amount
                },
                exc_info=True
            )
            raise PaymentError("Payment processing failed") from error

    async def _create_order(
        self,
        user_id: str,
        items: List[CartItem],
        payment: PaymentResult
    ) -> Order:
        """Create order record"""
        try:
            order = await self.order_api.create({
                "user_id": user_id,
                "items": items,
                "payment_id": payment.transaction_id,
                "status": OrderStatus.CONFIRMED
            })

            self.logger.info(
                "Order created",
                extra={
                    "order_id": order.order_id,
                    "user_id": user_id,
                    "items_count": len(items)
                }
            )

            return order
            
        except Exception as error:
            self.logger.error(
                "Order creation failed",
                extra={
                    "user_id": user_id,
                    "items": items,
                    "payment_id": payment.transaction_id
                },
                exc_info=True
            )
            raise OrderError("Failed to create order") from error

    async def _update_inventory(
        self,
        items: List[CartItem]
    ) -> None:
        """Update inventory levels"""
        try:
            await asyncio.gather(*[
                self.inventory_api.decrease(
                    item.product_id,
                    item.quantity
                )
                for item in items
            ])
            
        except Exception as error:
            self.logger.error(
                "Inventory update failed",
                extra={"items": items},
                exc_info=True
            )
            raise InventoryError("Failed to update inventory") from error

    async def _handle_checkout_error(
        self,
        error: Exception,
        user_id: str,
        items: List[CartItem]
    ) -> None:
        """Handle cleanup/rollback after checkout failure"""
        self.logger.warning(
            "Initiating checkout error cleanup",
            extra={
                "user_id": user_id,
                "items_count": len(items),
                "error": str(error)
            }
        )

        try:
            # Implement cleanup/rollback logic
            # For example:
            # - Refund payment if processed
            # - Restore inventory if decreased
            # - Update order status if created
            pass
            
        except Exception as cleanup_error:
            self.logger.error(
                "Cleanup after checkout failure failed",
                extra={
                    "original_error": str(error),
                    "cleanup_error": str(cleanup_error)
                },
                exc_info=True
            )

# Usage Example
async def handle_user_checkout(user_id: str, cart_items: List[CartItem]):
    checkout_service = CheckoutService()
    
    try:
        order = await checkout_service.process_checkout(
            user_id,
            cart_items
        )
        
        # Handle successful checkout
        await notify_user(user_id, {
            "type": "checkout_success",
            "order_id": order.order_id
        })
        
    except CheckoutError as error:
        # Handle checkout failure
        await notify_user(user_id, {
            "type": "checkout_failed",
            "error": str(error)
        })
        
        # Redirect to error page or show error message
        raise`
  },
  codeExamples: [
    {
      title: 'Common Promise Chain Issues',
      language: 'typescript',
      code: `// ❌ Common Issues in Promise Chains
async function processOrder(orderId: string) {
  // Issue 1: No error handling
  const order = await fetchOrder(orderId);
  const user = await fetchUser(order.userId);
  await processPayment(order.amount);
  
  // Issue 2: Sequential requests that could be parallel
  const items = [];
  for (const itemId of order.itemIds) {
    const item = await fetchItem(itemId);
    items.push(item);
  }
  
  // Issue 3: No cleanup on failure
  await updateInventory(items);
  await sendConfirmation(user.email);
}`,
      explanation: 'Common issues include lack of error handling, inefficient sequential requests, and missing cleanup logic.'
    },
    {
      title: 'Improved Promise Chain',
      language: 'typescript',
      code: `// ✅ Better Promise Chain Implementation
async function processOrder(orderId: string) {
  let inventoryUpdated = false;
  
  try {
    // Fetch order and user in parallel
    const [order, user] = await Promise.all([
      fetchOrder(orderId),
      fetchUser(order.userId)
    ]);

    // Validate order status
    if (order.status !== 'pending') {
      throw new Error(\`Invalid order status: \${order.status}\`);
    }

    // Process payment with retry logic
    const payment = await retry(
      () => processPayment(order.amount),
      { maxAttempts: 3 }
    );

    // Fetch items in parallel
    const items = await Promise.all(
      order.itemIds.map(fetchItem)
    );

    // Update inventory with transaction
    await beginTransaction();
    await updateInventory(items);
    inventoryUpdated = true;
    await commitTransaction();

    // Send confirmation
    await sendConfirmation(user.email);

    logger.info('Order processed successfully', {
      orderId,
      userId: user.id,
      amount: order.amount
    });

  } catch (error) {
    logger.error('Order processing failed', {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Cleanup: Rollback inventory if needed
    if (inventoryUpdated) {
      try {
        await rollbackInventory(items);
      } catch (rollbackError) {
        logger.error('Inventory rollback failed', {
          orderId,
          error: rollbackError
        });
      }
    }

    throw error;
  }
}`,
      explanation: 'This improved version includes parallel requests, proper error handling, cleanup logic, and logging.'
    }
  ],
  bestPractices: [
    'Use Promise.all() for parallel operations when requests are independent',
    'Implement proper error handling with specific error types',
    'Add logging for debugging and monitoring',
    'Include cleanup/rollback logic for failures',
    'Use transactions for related operations',
    'Implement retry logic for transient failures',
    'Add proper TypeScript types for better maintainability'
  ],
  commonPitfalls: [
    'Running requests sequentially when they could be parallel',
    'Missing error handling or using generic catch-all handlers',
    'Not implementing cleanup logic for partial failures',
    'Forgetting to log important events and errors',
    'Not handling edge cases in the business logic',
    'Missing type definitions leading to runtime errors'
  ]
};
