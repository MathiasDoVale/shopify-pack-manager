import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { action } from '../routes/app.packs.$id';
import PackDetail from '../routes/app.packs.$id';
import * as remix from '@remix-run/react';

describe('PackDetail', () => {

    const mockPack = {
        id: '1',
        name: 'Summer Pack',
        discount: 10,
        products: [
          { productId: 'gid://shopify/Product/1' },
          { productId: 'gid://shopify/Product/2' },
        ],
      };
    
      const mockProducts = [
        {
          id: 'gid://shopify/Product/1',
          title: 'T-Shirt',
          priceRange: { minVariantPrice: { amount: '20.00' } },
          images: { nodes: [{ url: 'https://example.com/img1.jpg', altText: 'T-Shirt' }] },
        },
        {
          id: 'gid://shopify/Product/2',
          title: 'Shorts',
          priceRange: { minVariantPrice: { amount: '30.00' } },
          images: { nodes: [{ url: 'https://example.com/img2.jpg', altText: 'Shorts' }] },
        },
      ];

      beforeEach(() => {
        vi.mocked(remix.useLoaderData).mockReturnValue({
          pack: mockPack,
          products: mockProducts,
        });
    });
    
    // Clean mocks after each test
    afterEach(() => {
        vi.clearAllMocks();
    });
    
    it('should render the form with correct initial values', () => {
        render(<PackDetail />);
        expect(screen.getByDisplayValue('Summer Pack')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
        expect(screen.getByText('Shorts')).toBeInTheDocument();
      });

    it('action returns error when discount is invalid', async () => {
      const formData = new FormData();
      formData.append('name', '');
      formData.append('discount', '');
      const request = new Request('http://test.com', {
        method: 'POST',
        body: formData
      });
      const result = await action({ request, params: { id: '1' } });
      const data = await result.json();
      expect(data.error).toBe('Discount must be a number.');
    });

    it('shows NaN in discount calculation when discount is invalid', async () => {
      render(<PackDetail />);
      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/name/i);
      const discountInput = screen.getByLabelText(/discount/i);
      await user.clear(nameInput);
      await user.clear(discountInput);
      const form = screen.getByTestId('form');
      await fireEvent.submit(form);
      expect(screen.getByText(/-NaN/)).toBeInTheDocument();
    });
});