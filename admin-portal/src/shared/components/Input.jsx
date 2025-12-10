const Input = ({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            block w-full rounded-lg border
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition duration-150 ease-in-out
            ${error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300'
            }
          `}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
