import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  create(dto: CreateProductDto): Promise<Product> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.repo.remove(product);
  }

  /** Seed determinista: 10 productos con IDs 1-10. */
  async seedIfEmpty(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;
    const seed: Array<Partial<Product>> = [
      { id: 1, name: 'Laptop Pro 14', description: 'Laptop 16GB RAM SSD 512GB', price: 1299.99, stock: 25 },
      { id: 2, name: 'Mouse inalámbrico', description: 'Mouse óptico 2.4GHz', price: 29.9, stock: 200 },
      { id: 3, name: 'Teclado mecánico', description: 'Teclado RGB switches blue', price: 89.99, stock: 120 },
      { id: 4, name: 'Monitor 27 4K', description: 'Monitor IPS 27 pulgadas 4K', price: 449.0, stock: 40 },
      { id: 5, name: 'Auriculares BT', description: 'Auriculares bluetooth con micrófono', price: 59.5, stock: 150 },
      { id: 6, name: 'SSD 1TB NVMe', description: 'Disco sólido NVMe 1TB', price: 99.99, stock: 80 },
      { id: 7, name: 'Memoria RAM 16GB', description: 'DDR4 3200MHz', price: 64.0, stock: 90 },
      { id: 8, name: 'Webcam FullHD', description: 'Webcam 1080p con micrófono', price: 49.99, stock: 70 },
      { id: 9, name: 'Silla ergonómica', description: 'Silla de oficina ergonómica', price: 199.0, stock: 30 },
      { id: 10, name: 'Hub USB-C', description: 'Hub 6 en 1 USB-C a HDMI/USB', price: 39.99, stock: 110 },
    ];
    await this.repo.save(seed);
  }
}
