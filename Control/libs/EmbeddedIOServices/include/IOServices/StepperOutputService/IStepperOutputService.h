#include "HardwareAbstraction/HardwareAbstractionCollection.h"
#include "Service/ServiceLocator.h"
#include "stdint.h"

using namespace HardwareAbstraction;
using namespace Service;

#if !defined(ISTEPPEROUTPUTSERVICE_H) && defined(HARDWAREABSTRACTIONCOLLECTION_H)
#define ISTEPPEROUTPUTSERVICE_H
namespace IOServices
{
	class IStepperOutputService
	{
	public:
		virtual void Step(int32_t steps) = 0;
		virtual void Calibrate() = 0;

		static void* CreateStepperOutputService(const ServiceLocator * const &serviceLocator, const void *config, unsigned int &sizeOut);
		static IStepperOutputService* CreateStepperOutputService(const HardwareAbstractionCollection *hardwareAbstractionCollection, const void *config, unsigned int &sizeOut);
	};
}
#endif
