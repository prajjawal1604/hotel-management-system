import React from 'react';

const InputField = React.forwardRef(({ label, error, onChange, ...props }, ref) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">
        {label}
        {props.required && '*'}
      </label>
      <input
        {...props}
        ref={ref}
        onChange={handleChange}
        className={`w-full px-4 py-2 rounded-lg border ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
        } focus:border-transparent focus:outline-none focus:ring-2 transition duration-200`}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;