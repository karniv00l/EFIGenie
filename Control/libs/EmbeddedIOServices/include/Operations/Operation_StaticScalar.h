#include "Operations/IOperation.h"
#include "Service/IService.h"
#include "Service/ServiceLocator.h"
#include "Packed.h"
#include "Interpolation.h"
#include "ScalarVariable.h"
#include "HardwareAbstraction/ITimerService.h"

/*
To create this operator
uint16									6001(BUILDER_OPERATION)
uint16									xx(InstanceID of Operation)
uint16									16(FactoryID)

To use this operator on a variable in the main loop
uint16									7001(BUILDER_VARIABLE)
uint16									16(FactoryID)
uint16									xx(InstanceID of Variable Result)
uint16									xx(InstanceID of Operation)
*/

#ifndef OPERATION_STATICSCALAR_H
#define OPERATION_STATICSCALAR_H
namespace Operations
{
	class Operation_StaticScalar : public IOperation<ScalarVariable>
	{
	protected:
        ScalarVariable _staticValue;
	public:		
        Operation_StaticScalar(const ScalarVariable &staticValue);

		ScalarVariable Execute() override;

		static IOperationBase *Create(Service::ServiceLocator * const &serviceLocator, const void *config, unsigned int &sizeOut);
		ISERVICE_REGISTERFACTORY_H
	};
}
#endif