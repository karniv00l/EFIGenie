#include "EngineControlServices/IgnitionService/IIgnitionConfig.h"
#include "Service/EngineControlServicesServiceBuilderRegister.h"
#include "Service/IOServicesServiceBuilderRegister.h"
#include "Service/HardwareAbstractionServiceBuilder.h"
#include "Service/ServiceBuilder.h"
#include "EngineControlServices/IgnitionService/IIgnitionConfig.h"
#include "EngineControlServices/IgnitionService/IgnitionConfig_Map_Ethanol.h"
#include "EngineControlServices/IgnitionService/IgnitionConfig_Static.h"
#include "EngineControlServices/IgnitionService/IgnitionConfigWrapper_HardRpmLimit.h"
#include "EngineControlServices/IgnitionService/IgnitionConfigWrapper_SoftPidRpmLimit.h"

namespace EngineControlServices
{
	void* IIgnitionConfig::CreateIgnitionConfig(const ServiceLocator * const &serviceLocator, const void *config, unsigned int &sizeOut)
	{	
		sizeOut = 0;
		IIgnitionConfig *ret = 0;
		
		switch (ServiceBuilder::CastAndOffset<uint8_t>(config, sizeOut))
		{
#ifdef IGNITIONCONFIG_STATIC_H
		case 1:
			ret = new IgnitionConfig_Static(
				ServiceBuilder::CastConfigAndOffset < IgnitionConfig_StaticConfig >(config, sizeOut));
			break;
#endif
#ifdef IGNITIONCONFIG_MAP_ETHANOL_H
		case 2:
			{
				const IgnitionConfig_Map_EthanolConfig *ignitionConfigConfig = ServiceBuilder::CastConfigAndOffset < IgnitionConfig_Map_EthanolConfig >(config, sizeOut);
				ret = new IgnitionConfig_Map_Ethanol(
					ignitionConfigConfig,
					serviceLocator->LocateAndCast<RpmService>(RPMSERVICE),
					serviceLocator->LocateAndCast<IFloatInputService>(BUILDER_IFLOATINPUTSERVICE, INSTANCE_ETHANOL_CONTENT),
					serviceLocator->LocateAndCast<IFloatInputService>(BUILDER_IFLOATINPUTSERVICE, INSTANCE_MANIFOLD_ABSOLUTE_PRESSURE));
				break;
			}
#endif
#ifdef IGNITIONCONFIGWRAPPER_HARDRPMLIMIT_H
		case 3:
			{
				const IgnitionConfigWrapper_HardRpmLimitConfig *ignitionConfig = ServiceBuilder::CastConfigAndOffset < IgnitionConfigWrapper_HardRpmLimitConfig >(config, sizeOut);

				IBooleanInputService *booleanInputService = ServiceBuilder::CreateServiceAndOffset<IBooleanInputService>(IBooleanInputService::BuildBooleanInputService, serviceLocator, config, sizeOut);
				
				IIgnitionConfig *child = ServiceBuilder::CreateServiceAndOffset<IIgnitionConfig>(IIgnitionConfig::CreateIgnitionConfig, serviceLocator, config, sizeOut);
				
				ret = new IgnitionConfigWrapper_HardRpmLimit(
					ignitionConfig,  
					serviceLocator->LocateAndCast<RpmService>(RPMSERVICE),
					booleanInputService,
					child);
				
				break;
			}
#endif
#ifdef IGNITIONCONFIGWRAPPER_SOFTPIDRPMLIMIT_H
		case 4:
			{
				const IgnitionConfigWrapper_SoftPidRpmLimitConfig *ignitionConfig = ServiceBuilder::CastConfigAndOffset < IgnitionConfigWrapper_SoftPidRpmLimitConfig >(config, sizeOut);

				IBooleanInputService *booleanInputService = ServiceBuilder::CreateServiceAndOffset<IBooleanInputService>(IBooleanInputService::BuildBooleanInputService, serviceLocator, config, sizeOut);
				
				IIgnitionConfig *child = ServiceBuilder::CreateServiceAndOffset<IIgnitionConfig>(IIgnitionConfig::CreateIgnitionConfig, serviceLocator, config, sizeOut);
				
				ret = new IgnitionConfigWrapper_SoftPidRpmLimit(
					ignitionConfig,
					serviceLocator->LocateAndCast<ITimerService>(TIMER_SERVICE_ID), 
					serviceLocator->LocateAndCast<RpmService>(RPMSERVICE),
					booleanInputService,
					child);
				
				break;
			}
#endif
		}
		return ret;
	}
}