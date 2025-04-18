import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { action } from '../routes/app.create';
import NewPack from '../routes/app.create';

describe('NewPack', () => {
  beforeEach(() => {
    if (typeof window === 'undefined') {
      global.window = {};
    }
    
    window.shopify = {
      resourcePicker: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          {
            id: 'gid://shopify/Product/12345',
            title: 'Test product 1',
            images: [{ originalSrc: 'https://example.com/image1.jpg' }]
          },
          {
            id: 'gid://shopify/Product/67890',
            title: 'Test product 2',
            images: []
          }
        ]);
      })
    };
  });
  
  // Clean mocks after each test
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the form correctly', () => {
    render(<NewPack />);
    expect(screen.getByText('Create pack')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByText('Discount (%)')).toBeInTheDocument();
    expect(screen.getByTestId('input-discount')).toBeInTheDocument();
    expect(screen.getByText('Select product')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
  
  it('should open the resourcePicker when clicking the "Select product" button', async () => {
    render(<NewPack />);
    fireEvent.click(screen.getByText('Select product'));
    await waitFor(() => {
      expect(window.shopify.resourcePicker).toHaveBeenCalledTimes(1);
      expect(window.shopify.resourcePicker).toHaveBeenCalledWith({
        type: 'product',
        action: 'select',
        multiple: true
      });
    });
  });

  it('should display selected products after selection from resourcePicker', async () => {
    render(<NewPack />);
    fireEvent.click(screen.getByText('Select product'));
    await waitFor(() => {
      expect(screen.getByText('Test product 1')).toBeInTheDocument();
      expect(screen.getByText('Test product 2')).toBeInTheDocument();
    });
  });

  it('allows updating form fields', async () => {
    render(<NewPack />);
    const nameInput = screen.getByTestId('input-name');
    const discountInput = screen.getByTestId('input-discount');
    fireEvent.change(nameInput, { target: { value: 'Test Pack' } });
    fireEvent.change(discountInput, { target: { value: '15' } });
    expect(nameInput.value).toBe('Test Pack');
    expect(discountInput.value).toBe('15');
  });
});
  
describe('discount validation', () => {
  it('should reject discount values greater than 100', async () => {
    const request = new Request('http://localhost:3000/app/create', {
      method: 'POST',
      body: new URLSearchParams({
        name: 'Test Pack',
        discount: '150',
        productIds: 'gid://shopify/Product/12345'
      })
    });
    
    const response = await action({ request });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('between 1 and 100');
    expect(data.fields.discount).toBe(true);
  });

  it('should reject discount values equal to 0', async () => {
    const request = new Request('http://localhost:3000/app/create', {
      method: 'POST',
      body: new URLSearchParams({
        name: 'Test Pack',
        discount: '0',
        productIds: 'gid://shopify/Product/12345'
      })
    });
    
    const response = await action({ request });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('between 1 and 100');
    expect(data.fields.discount).toBe(true);
  });

  it('should reject discount with negative values', async () => {
    const request = new Request('http://localhost:3000/app/create', {
      method: 'POST',
      body: new URLSearchParams({
        name: 'Test Pack',
        discount: '-50',
        productIds: 'gid://shopify/Product/12345'
      })
    });
    
    const response = await action({ request });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('between 1 and 100');
    expect(data.fields.discount).toBe(true);
  });
});
