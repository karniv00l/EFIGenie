#if defined(IEthanolServiceExists)
#define EthanolService_StaticExists
namespace EngineManagement
{
	class EthanolService_Static : public IEthanolService
	{
	public:
		EthanolService_Static(float ethanolContent) { EthanolContent = ethanolContent;  }
		void ReadEthanolContent() { };
	};
}
#endif