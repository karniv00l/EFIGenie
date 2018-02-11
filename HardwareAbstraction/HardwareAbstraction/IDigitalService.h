namespace HardwareAbstraction
{
	class IDigitalService
	{
	public:
		virtual void InitPin(unsigned char pin, PinDirection direction) = 0; //pin 0 should be for "null"
		virtual bool ReadPin(unsigned char pin) = 0; //pin 0 should be for "null"
		virtual void WritePin(unsigned char pin, bool value) = 0; //pin 0 should be for "null"
	};
}