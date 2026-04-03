import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneInput } from './phone-input';

describe('PhoneInput', () => {
  it('renders with default country (Russia)', () => {
    render(<PhoneInput />);

    expect(screen.getByText('🇷🇺')).toBeInTheDocument();
    expect(screen.getByText('+7')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<PhoneInput placeholder="Enter phone" />);

    expect(screen.getByPlaceholderText('Enter phone')).toBeInTheDocument();
  });

  it('opens dropdown when clicking country selector', () => {
    render(<PhoneInput />);

    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    // Check if dropdown is open by looking for other countries
    expect(screen.getByText('Казахстан')).toBeInTheDocument();
    expect(screen.getByText('Беларусь')).toBeInTheDocument();
    expect(screen.getByText('Таиланд')).toBeInTheDocument();
  });

  it('selects a country from dropdown', () => {
    const onChange = jest.fn();
    render(<PhoneInput onChange={onChange} />);

    // Open dropdown
    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    // Select Germany
    const germanyOption = screen.getByText('Германия');
    fireEvent.click(germanyOption);

    // Check if Germany is now selected
    expect(screen.getByText('🇩🇪')).toBeInTheDocument();
    expect(screen.getByText('+49')).toBeInTheDocument();
  });

  it('calls onChange with full phone number', () => {
    const onChange = jest.fn();
    render(<PhoneInput onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '999 123-45-67' } });

    expect(onChange).toHaveBeenCalledWith('+7 999 123-45-67');
  });

  it('calls onChange with empty string when input is cleared', () => {
    const onChange = jest.fn();
    render(<PhoneInput onChange={onChange} value="+7 999" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('is disabled when disabled prop is true', () => {
    render(<PhoneInput disabled />);

    const input = screen.getByRole('textbox');
    const selector = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(selector).toBeDisabled();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <PhoneInput />
        <div data-testid="outside">Outside</div>
      </div>
    );

    // Open dropdown
    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    expect(screen.getByText('Казахстан')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Dropdown should be closed
    expect(screen.queryByText('Казахстан')).not.toBeInTheDocument();
  });

  it('includes Asian countries', () => {
    render(<PhoneInput />);

    // Open dropdown
    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    // Check for Asian countries
    expect(screen.getByText('Таиланд')).toBeInTheDocument();
    expect(screen.getByText('Вьетнам')).toBeInTheDocument();
    expect(screen.getByText('Япония')).toBeInTheDocument();
    expect(screen.getByText('Южная Корея')).toBeInTheDocument();
    expect(screen.getByText('Китай')).toBeInTheDocument();
    expect(screen.getByText('Сингапур')).toBeInTheDocument();
  });

  it('includes Middle East countries', () => {
    render(<PhoneInput />);

    // Open dropdown
    const selector = screen.getByRole('button');
    fireEvent.click(selector);

    expect(screen.getByText('ОАЭ')).toBeInTheDocument();
    expect(screen.getByText('Саудовская Аравия')).toBeInTheDocument();
    expect(screen.getByText('Израиль')).toBeInTheDocument();
  });
});
