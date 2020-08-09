import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}
interface IProduct {
  product_id: string;
  price: number;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Invalid customer');
    }

    const findedProducts = await this.productsRepository.findAllById(
      products.map(pro => ({ id: pro.id })),
    );

    if (products.length !== findedProducts.length) {
      throw new AppError('Invalid products.');
    }

    const order_products = findedProducts.map((product, index) => {
      if (products[index].quantity > product.quantity) {
        throw new AppError('Insufficient Products');
      }

      return {
        product_id: product.id,
        quantity: products[index].quantity,
        price: product.price,
      };
    });

    const createdOrder = await this.ordersRepository.create({
      customer,
      products: [...order_products],
    });

    await this.productsRepository.updateQuantity(products);

    return createdOrder;
  }
}

export default CreateOrderService;
