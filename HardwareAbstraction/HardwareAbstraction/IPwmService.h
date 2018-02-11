namespace HardwareAbstraction
{
	struct PwmValue
	{
		float Period;
		float PulseWidth;
	};

	class IPwmService
	{
	public:
		virtual void InitPin(unsigned char pin, PinDirection direction) = 0; //pin 0 should be for "null"
		virtual PwmValue ReadPin(unsigned char pin) = 0; //pin 0 should be for "null"
		virtual void WritePin(unsigned char pin, PwmValue value) = 0; //pin 0 should be for "null"
	};
}