// tests/setup.js (or your chosen path)
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
// --- Global Mocks ---

// Mock remix modules
vi.mock('@remix-run/react', async (importOriginal) => {
    const original = await importOriginal(); // Import actual module
    return {
        ...original, // Keep original exports
        // Override specific components/hooks used across tests
        Form: (props) => (
            <form {...props} data-testid="form">
                {props.children}
            </form>
        ),
        useActionData: vi.fn(),
        useLoaderData: vi.fn(), // Mock other hooks if needed globally
        useNavigate: vi.fn(() => vi.fn()), // Mock navigate function (often returns a function)
        useSubmit: vi.fn(() => vi.fn()),   // Mock submit function (often returns a function)
        Link: (props) => <a href={props.to} {...props} data-testid="link">{props.children}</a>, // Simple Link mock
        Outlet: () => <div data-testid="outlet" />, // Mock Outlet for layout tests if needed
        // Add other Remix mocks as needed (e.g., useRouteError if testing ErrorBoundary)
    };
});

// Mock Polaris Components
vi.mock('@shopify/polaris', () => {
    // Components used in create.test.jsx
    const Text = (props) => <div data-testid={`polaris-text-${props.variant || 'default'}`} {...props}>{props.children}</div>;
    const BlockStack = (props) => <div {...props}>{props.children}</div>;
    const Button = (props) => {
        const { submit, onClick, children, ...restProps } = props;
        return (
            <button
                {...restProps}
                onClick={onClick}
                type={submit ? 'submit' : 'button'}
                data-polaris-button // Add attribute for potential selection
            >
                {children}
            </button>
        );
    };
    const Layout = (props) => <div>{props.children}</div>;
    Layout.Section = (props) => <div>{props.children}</div>;
    const Card = (props) => <div className={props.sectioned ? 'sectioned' : ''}>{props.children}</div>;
    const TextField = (props) => {
        const { label, name, value, onChange, error, ...restProps } = props;
        return (
            <div>
                <label htmlFor={name}>{label}</label>
                <input
                    id={name}
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange && onChange(e.target.value, name)} // Polaris onChange often passes (value, id/name)
                    data-testid={`input-${name}`}
                    aria-invalid={!!error}
                    {...restProps}
                />
                {error && <div data-testid={`error-${name}`}>{error}</div>}
            </div>
        );
    };

    // Components used in app.packs.$id.jsx
    const Page = (props) => <div>{props.children}</div>; // Simple Page mock
    const ResourceList = (props) => <ul>{props.items.map((item, index) => props.renderItem(item, `${item.id || index}`))}</ul>;
    const ResourceItem = (props) => <li id={props.id}>{props.children}</li>;
    const Thumbnail = (props) => <img src={props.source} alt={props.alt || ''} width="40" height="40" />;
    const Badge = (props) => <span className={`badge-${props.tone || 'default'}`}>{props.children}</span>;
    const Modal = (props) => props.open ? <div role="dialog">{props.children}</div> : null;
    Modal.Section = (props) => <div>{props.children}</div>;

    // Components used in app.jsx (if needed for layout tests)
    const AppProvider = ({ children }) => <div>{children}</div>; // Simple mock for AppProvider
    const NavMenu = ({ children }) => <nav>{children}</nav>; // Simple mock for NavMenu

    return {
        // create.test.jsx components
        Text,
        BlockStack,
        Button,
        Layout,
        Card,
        TextField,
        // app.packs.$id.jsx components
        Page,
        ResourceList,
        ResourceItem,
        Thumbnail,
        Badge,
        Modal,
        // app.jsx components
        AppProvider,
        NavMenu,
        // Add other Polaris components you use across tests
    };
});

// Mock Polaris Icons (if used directly, like in app.packs.$id.jsx)
vi.mock('@shopify/polaris-icons', () => ({
    DeleteIcon: () => <svg data-testid="delete-icon" /> // Simple mock for DeleteIcon
    // Add other icons as needed
}));


// Mock db.server
vi.mock('../db.server', () => ({
    default: {
        pack: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            // Add other methods if needed
        },
        relationPackProduct: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
            // Add other methods if needed
        },
        session: { // For webhook tests etc. (like in webhooks.app.uninstalled.jsx)
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        }
        // Add other models if needed
    }
}));

// Mock shopify.server (used in multiple places)
vi.mock('../shopify.server', () => ({
    authenticate: {
        admin: vi.fn().mockResolvedValue({
            admin: { graphql: vi.fn() }, // Mock the graphql function if needed by loaders/actions
            session: { shop: 'test-shop.myshopify.com', id: 'test-session-id' } // Mock session data if needed
        }),
        webhook: vi.fn().mockResolvedValue({ shop: 'test-shop.myshopify.com', session: {id: 'test-session-id', shop: 'test-shop.myshopify.com'}, topic: 'APP_UNINSTALLED' }),
    }
}));

// Mock models (if used across multiple tests, like Packs.server in app.packs.$id.jsx)
vi.mock('../models/Packs.server', () => ({
    getPack: vi.fn(),
    getProductsFromGIDs: vi.fn(),
    updatePack: vi.fn(),
    deletePack: vi.fn(),
    getPacks: vi.fn(), // Add other functions used across tests
}));

// Mock @shopify/shopify-app-remix/server (for ErrorBoundary/headers in app.jsx)
vi.mock('@shopify/shopify-app-remix/server', () => ({
    boundary: {
        error: vi.fn((error) => <div data-testid="boundary-error">{JSON.stringify(error)}</div>),
        headers: vi.fn(() => ({})),
    }
}));

// --- Optional: Global Test Lifecycle Hooks ---
// Consider using `clearMocks: true` in vitest config instead
// import { afterEach } from 'vitest';
// afterEach(() => {
//    vi.clearAllMocks();
// });